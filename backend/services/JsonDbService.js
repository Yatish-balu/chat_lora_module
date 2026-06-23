const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonDbService {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error(`Error reading ${this.filePath}:`, err);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Error writing ${this.filePath}:`, err);
    }
  }

  async find(query = {}) {
    const items = this.read();
    const matched = items.filter(item => this._matches(item, query));
    
    // Wrap matches in MongooseMockDoc
    const wrapModel = require('./DbWrapper');
    const MongooseMockDoc = wrapModel.MongooseMockDoc;
    return matched.map(item => new MongooseMockDoc(item, this.collectionName, this));
  }

  async findOne(query = {}) {
    const items = this.read();
    const item = items.find(item => this._matches(item, query));
    if (!item) return null;

    const wrapModel = require('./DbWrapper');
    const MongooseMockDoc = wrapModel.MongooseMockDoc;
    return new MongooseMockDoc(item, this.collectionName, this);
  }

  async findById(id) {
    return this.findOne({ _id: String(id) });
  }

  async countDocuments(query = {}) {
    const items = this.read();
    return items.filter(item => this._matches(item, query)).length;
  }

  async create(doc) {
    const items = this.read();
    const newDoc = {
      _id: doc._id || String(Math.random().toString(36).substring(2, 9)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    items.push(newDoc);
    this.write(items);

    const wrapModel = require('./DbWrapper');
    const MongooseMockDoc = wrapModel.MongooseMockDoc;
    return new MongooseMockDoc(newDoc, this.collectionName, this);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    return this.findOneAndUpdate({ _id: String(id) }, update, options);
  }

  async findOneAndUpdate(query, update, options = {}) {
    const items = this.read();
    const idx = items.findIndex(item => this._matches(item, query));
    if (idx === -1) {
      if (options.upsert) {
        // Simple upsert support
        const newDoc = await this.create(query);
        return this.findOneAndUpdate(query, update, { ...options, upsert: false });
      }
      return null;
    }

    const current = items[idx];
    let updated = { ...current };

    if (update.$set) {
      updated = { ...updated, ...update.$set };
    } else {
      updated = { ...updated, ...update };
    }
    updated.updatedAt = new Date().toISOString();
    items[idx] = updated;
    this.write(items);

    const wrapModel = require('./DbWrapper');
    const MongooseMockDoc = wrapModel.MongooseMockDoc;
    return new MongooseMockDoc(updated, this.collectionName, this);
  }

  async updateMany(query, update) {
    const items = this.read();
    let modifiedCount = 0;
    
    const updatedItems = items.map(item => {
      if (this._matches(item, query)) {
        modifiedCount++;
        let updated = { ...item };
        if (update.$set) {
          updated = { ...updated, ...update.$set };
        } else {
          updated = { ...updated, ...update };
        }
        updated.updatedAt = new Date().toISOString();
        return updated;
      }
      return item;
    });

    this.write(updatedItems);
    return { modifiedCount };
  }

  _matches(item, query) {
    for (const key in query) {
      const val = query[key];
      if (val === undefined) continue;

      if (typeof val === 'object' && val !== null) {
        if (val.$ne !== undefined && String(item[key]) === String(val.$ne)) return false;
        if (val.$in !== undefined && !val.$in.map(String).includes(String(item[key]))) return false;
        if (val.$all !== undefined && !val.$all.every(v => Array.isArray(item[key]) && item[key].map(String).includes(String(v)))) return false;
        // Simple $or support
        if (key === '$or') {
          return val.some(subQuery => this._matches(item, subQuery));
        }
      } else if (val instanceof RegExp) {
        if (!item[key] || !val.test(item[key])) return false;
      } else if (String(item[key]) !== String(val)) {
        return false;
      }
    }
    return true;
  }
}

module.exports = JsonDbService;
