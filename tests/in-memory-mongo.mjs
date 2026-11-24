import { ObjectId } from "mongodb";

function getPath(value, path) {
  return path.split(".").reduce((current, part) => current?.[part], value);
}

function equals(actual, expected) {
  if (actual instanceof ObjectId) return String(actual) === String(expected);
  if (expected instanceof ObjectId) return String(actual) === String(expected);
  return actual === expected;
}

function matches(document, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === "$or") return expected.some((clause) => matches(document, clause));
    const actual = getPath(document, key);
    if (expected && typeof expected === "object" && "$elemMatch" in expected) {
      return Array.isArray(actual) && actual.some((item) => matches(item, expected.$elemMatch));
    }
    if (expected && typeof expected === "object" && "$ne" in expected) return !equals(actual, expected.$ne);
    return equals(actual, expected);
  });
}

function compare(left, right, order) {
  for (const [key, direction] of Object.entries(order || {})) {
    const a = getPath(left, key);
    const b = getPath(right, key);
    if (a === b) continue;
    if (a == null) return -1 * direction;
    if (b == null) return direction;
    return (a < b ? -1 : 1) * direction;
  }
  return 0;
}

export class InMemoryMongoCollection {
  records = new Map();

  async findOne(filter) {
    return [...this.records.values()].find((record) => matches(record, filter)) || null;
  }

  find(filter = {}) {
    let sortOrder = {};
    let limit = Infinity;
    return {
      sort(order) { sortOrder = order; return this; },
      limit(value) { limit = value; return this; },
      async toArray() {
        return [...this.records.values()]
          .filter((record) => matches(record, filter))
          .sort((left, right) => compare(left, right, sortOrder))
          .slice(0, limit);
      },
      records: this.records,
    };
  }

  async insertOne(document) {
    if ([...this.records.values()].some((record) => record.slug === document.slug)) {
      const error = new Error("Duplicate slug");
      error.code = 11000;
      throw error;
    }
    const inserted = { ...document, _id: new ObjectId() };
    this.records.set(String(inserted._id), inserted);
    return { insertedId: inserted._id };
  }

  async findOneAndUpdate(filter, update) {
    const current = [...this.records.values()].find((record) => matches(record, filter));
    if (!current) return null;
    Object.assign(current, update.$set);
    return current;
  }

  async deleteOne(filter) {
    const entry = [...this.records.entries()].find(([, record]) => matches(record, filter));
    if (!entry) return { deletedCount: 0 };
    this.records.delete(entry[0]);
    return { deletedCount: 1 };
  }

  async findOneAndDelete(filter) {
    const entry = [...this.records.entries()].find(([, record]) => matches(record, filter));
    if (!entry) return null;
    this.records.delete(entry[0]);
    return entry[1];
  }

  async updateOne(filter, update, options = {}) {
    const id = filter._id;
    let record = this.records.get(String(id));
    if (!record && options.upsert) {
      record = { ...update.$setOnInsert, _id: id };
      this.records.set(String(id), record);
    }
    if (!record) return { matchedCount: 0, modifiedCount: 0 };
    Object.assign(record, update.$set);
    for (const [field, amount] of Object.entries(update.$inc || {})) record[field] = (record[field] || 0) + amount;
    return { matchedCount: 1, modifiedCount: 1 };
  }
}
