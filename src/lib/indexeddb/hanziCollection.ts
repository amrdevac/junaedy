export type HanziRecord = {
  id: string;
  hanzi: string;
  pinyin?: string;
  meaning: string;
  proficiency: "baru" | "belajar" | "mahir";
  createdAt: string;
};

export type QuizHistoryEntry = {
  id: string;
  createdAt: string;
  durationMs: number;
  totalQuestions: number;
  correctCount: number;
  answers: QuizHistoryAnswer[];
};

export type QuizHistoryAnswer = {
  id: string;
  prompt: string;
  answer: string;
  userAnswer: string;
  isCorrect: boolean;
  direction: "hanzi-to-meaning" | "meaning-to-hanzi";
};

const DB_NAME = "junaedy-hanzi";
const DB_VERSION = 2;
const STORE_NAME = "characters";
const QUIZ_STORE = "quizHistory";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise(function (resolve, reject) {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function () {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(QUIZ_STORE)) {
        db.createObjectStore(QUIZ_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = function () {
      resolve(request.result);
    };

    request.onerror = function () {
      reject(request.error);
    };
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise(function (resolve, reject) {
    transaction.oncomplete = function () {
      resolve();
    };
    transaction.onerror = function () {
      reject(transaction.error);
    };
    transaction.onabort = function () {
      reject(transaction.error);
    };
  });
}

export async function addHanziRecords(records: HanziRecord[]): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  records.forEach(function (record) {
    store.put(record);
  });

  await transactionDone(transaction);
  db.close();
}

export async function getAllHanziRecords(): Promise<HanziRecord[]> {
  if (typeof window === "undefined") return [];
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();

  const records = await new Promise<HanziRecord[]>(function (resolve, reject) {
    request.onsuccess = function () {
      resolve(request.result as HanziRecord[]);
    };
    request.onerror = function () {
      reject(request.error);
    };
  });

  await transactionDone(transaction);
  db.close();
  return records;
}

export async function deleteHanziRecord(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.delete(id);
  await transactionDone(transaction);
  db.close();
}

export async function deleteHanziRecords(ids: string[]): Promise<void> {
  if (typeof window === "undefined") return;
  if (ids.length === 0) return;
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  ids.forEach(function (id) {
    store.delete(id);
  });

  await transactionDone(transaction);
  db.close();
}

export async function addQuizHistory(entry: QuizHistoryEntry): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await openDatabase();
  const transaction = db.transaction(QUIZ_STORE, "readwrite");
  const store = transaction.objectStore(QUIZ_STORE);
  store.put(entry);
  await transactionDone(transaction);
  db.close();
}
