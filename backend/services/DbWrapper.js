const mongoose = require('mongoose');
const JsonDbService = require('./JsonDbService');

class MongooseMockDoc {
  constructor(data, collectionName, dbService) {
    Object.assign(this, data);
    this._collectionName = collectionName;
    this._dbService = dbService;
  }

  toObject() {
    const obj = { ...this };
    delete obj._collectionName;
    delete obj._dbService;
    return obj;
  }

  async save(options = {}) {
    const cleanData = this.toObject();
    await this._dbService.findByIdAndUpdate(this._id, cleanData);
    return this;
  }

  async populate(pathOrOptions) {
    let paths = [];
    if (Array.isArray(pathOrOptions)) {
      paths = pathOrOptions.map(p => typeof p === 'string' ? p : p.path);
    } else if (pathOrOptions) {
      paths = [typeof pathOrOptions === 'string' ? pathOrOptions : pathOrOptions.path];
    }

    const User = require('../models/User');
    const Message = require('../models/Message');

    for (const p of paths) {
      if (p === 'sender' && this.sender && typeof this.sender === 'string') {
        this.sender = await User.findById(this.sender);
      }
      if (p === 'receiver' && this.receiver && typeof this.receiver === 'string') {
        this.receiver = await User.findById(this.receiver);
      }
      if (p === 'participants' && Array.isArray(this.participants)) {
        this.participants = await Promise.all(
          this.participants.map(async id => typeof id === 'string' ? await User.findById(id) : id)
        );
      }
      if (p === 'replyTo' && this.replyTo && typeof this.replyTo === 'string') {
        this.replyTo = await Message.findById(this.replyTo);
      }

      // Safeguard password Hash fields
      if (this.sender && this.sender.passwordHash) delete this.sender.passwordHash;
      if (this.receiver && this.receiver.passwordHash) delete this.receiver.passwordHash;
      if (this.replyTo && this.replyTo.sender && typeof this.replyTo.sender === 'object') {
        delete this.replyTo.sender.passwordHash;
      }
      if (Array.isArray(this.participants)) {
        this.participants.forEach(user => user && delete user.passwordHash);
      }
    }
    return this;
  }

  // Model-specific instance methods
  async incrementUnread(userId) {
    if (!this.unreadCounts) this.unreadCounts = {};
    const key = String(userId);
    this.unreadCounts[key] = (this.unreadCounts[key] || 0) + 1;
    await this.save();
    return this;
  }

  async resetUnread(userId) {
    if (!this.unreadCounts) this.unreadCounts = {};
    const key = String(userId);
    this.unreadCounts[key] = 0;
    await this.save();
    return this;
  }
}

class MongooseQueryMock {
  constructor(promise) {
    this.promise = promise;
  }

  select(arg) {
    return this;
  }

  populate(arg) {
    this.promise = this.promise.then(async (result) => {
      if (Array.isArray(result)) {
        return Promise.all(result.map(doc => doc ? doc.populate(arg) : doc));
      }
      return result ? result.populate(arg) : result;
    });
    return this;
  }

  limit(arg) {
    return this;
  }

  skip(arg) {
    return this;
  }

  sort(arg) {
    return this;
  }

  then(onFulfilled, onRejected) {
    return this.promise.then(onFulfilled, onRejected);
  }
}

function wrapModel(modelName, mongooseModel) {
  const jsonDb = new JsonDbService(modelName.toLowerCase() + 's');

  const handler = {
    get(target, prop) {
      const isConnected = mongoose.connection.readyState === 1;

      if (isConnected) {
        return Reflect.get(mongooseModel, prop);
      }

      // MOCK STATICS FOR LORA/HYBRID MODE WITHOUT DB
      if (modelName === 'Chat' && prop === 'findOrCreateDirect') {
        return async function(userIdA, userIdB) {
          const ids = [userIdA, userIdB].map(String).sort();

          let chat = await jsonDb.findOne({
            chatType: 'direct',
            participants: { $all: ids, $size: 2 },
          });

          if (!chat) {
            chat = await jsonDb.create({
              chatType: 'direct',
              participants: ids,
              unreadCounts: { [ids[0]]: 0, [ids[1]]: 0 },
            });
          }
          await chat.populate('participants');
          return chat;
        };
      }

      if (modelName === 'Message' && prop === 'markDelivered') {
        return async function(chatId, receiverId) {
          return jsonDb.updateMany(
            {
              chat: chatId,
              receiver: receiverId,
              status: { $in: ['sent', 'queued'] },
            },
            {
              status: 'delivered',
              deliveredAt: new Date().toISOString()
            }
          );
        };
      }

      if (modelName === 'Message' && prop === 'markRead') {
        return async function(chatId, readerId) {
          return jsonDb.updateMany(
            {
              chat: chatId,
              receiver: readerId,
              status: { $in: ['sent', 'delivered', 'queued'] },
            },
            {
              status: 'read',
              readAt: new Date().toISOString()
            }
          );
        };
      }

      // Default JSON fallback
      console.log(`[JSON DB Fallback] Executing ${modelName}.${String(prop)}`);
      
      // If method is in our JSON DB, return it and wrap queries in MongooseQueryMock
      if (typeof jsonDb[prop] === 'function') {
        const originalMethod = jsonDb[prop].bind(jsonDb);
        return function(...args) {
          const promise = originalMethod(...args);
          if (['find', 'findOne', 'findById'].includes(prop)) {
            return new MongooseQueryMock(promise);
          }
          return promise;
        };
      }

      // Return a basic function or property as fallback
      const value = Reflect.get(jsonDb, prop);
      if (value !== undefined) return value;

      return function() {
        console.warn(`[JSON DB Fallback] Method ${modelName}.${String(prop)} is a dummy placeholder`);
        return this;
      };
    }
  };

  return new Proxy(mongooseModel, handler);
}

module.exports = wrapModel;
module.exports.MongooseMockDoc = MongooseMockDoc;
