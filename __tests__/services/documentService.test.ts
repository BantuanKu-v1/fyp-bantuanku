import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import {
  uploadRegistrationDocument,
  uploadRegistrationDocuments,
} from "../../src/services/documentService";
import type { SelectedDocument } from "../../src/types/documents";
import { DOCUMENT_BUCKET } from "../../src/constants/documents";
import { supabase } from "../../src/lib/supabase";
import * as Crypto from "expo-crypto";

jest.mock("../../src/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(),
}));

const mockGetUser = jest.mocked(supabase.auth.getUser);
const mockStorageFrom = jest.mocked(supabase.storage.from);
const mockDatabaseFrom = jest.mocked(supabase.from);
const mockRandomUUID = jest.mocked(Crypto.randomUUID);

const USER_ID = "user-001";
const PROFILE_ID = "profile-001";
const FILE_ID = "550e8400-e29b-41d4-a716-446655440000";

const STORAGE_PATH = `${USER_ID}/mykad/${FILE_ID}.pdf`;

type MockResult = {
  data?: unknown;
  error: Error | null;
};

const createDocument = (
    overrides: Partial<SelectedDocument> = {}
): SelectedDocument => ({
  name: "mykad.pdf",
  uri: "file:///documents/mykad.pdf",
  mimeType: "application/pdf",
  size: 1024,
  documentType: "mykad",
  ...overrides,
} as SelectedDocument);

const createMockDatabaseQuery = () => {
  const query = {
    insert: jest.fn<(...args: unknown[]) => unknown>(),
    select: jest.fn<(...args: unknown[]) => unknown>(),
    single: jest.fn<(...args: unknown[]) => Promise<MockResult>>(),
  };

  query.insert.mockReturnValue(query);
  query.select.mockReturnValue(query);

  return query;
};

const createMockStorage = () => ({
  upload: jest.fn<(...args: unknown[]) => Promise<MockResult>>(),
  remove: jest.fn<(...args: unknown[]) => Promise<MockResult>>(),
});

const mockAuthenticatedUser = () => {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: USER_ID,
      },
    },
    error: null,
  } as never);
};

const mockUnauthenticatedUser = () => {
  mockGetUser.mockResolvedValue({
    data: {
      user: null,
    },
    error: null,
  } as never);
};

const mockAuthenticationError = (message: string) => {
  mockGetUser.mockResolvedValue({
    data: {
      user: null,
    },
    error: new Error(message),
  } as never);
};

const createDocumentRecord = (
    overrides: Record<string, unknown> = {}
) => ({
  id: "document-001",
  profile_id: PROFILE_ID,
  document_type: "mykad",
  original_filename: "mykad.pdf",
  storage_path: STORAGE_PATH,
  mime_type: "application/pdf",
  file_size_bytes: 1024,
  ...overrides,
});

describe("Document Service", () => {
  let storage: ReturnType<typeof createMockStorage>;
  let databaseQuery: ReturnType<typeof createMockDatabaseQuery>;
  let fileBody: ArrayBuffer;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();

    fileBody = new ArrayBuffer(8);

    mockAuthenticatedUser();

    mockRandomUUID.mockReturnValue(FILE_ID as never);

    storage = createMockStorage();
    databaseQuery = createMockDatabaseQuery();

    storage.upload.mockResolvedValue({
      data: {
        path: STORAGE_PATH,
      },
      error: null,
    });

    storage.remove.mockResolvedValue({
      data: [],
      error: null,
    });

    databaseQuery.single.mockResolvedValue({
      data: createDocumentRecord(),
      error: null,
    });

    mockStorageFrom.mockReturnValue(storage as never);
    mockDatabaseFrom.mockReturnValue(databaseQuery as never);

    mockFetch = jest.fn<typeof fetch>();

    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: jest.fn<() => Promise<ArrayBuffer>>()
          .mockResolvedValue(fileBody),
    } as unknown as Response);

    global.fetch = mockFetch;

    consoleErrorSpy = jest.spyOn(console, "error")
        .mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("uploadRegistrationDocument", () => {
    it("should upload a document and return its database record", async () => {
      const result = await uploadRegistrationDocument(
          PROFILE_ID,
          createDocument()
      );

      expect(result).toEqual(createDocumentRecord());

      expect(mockGetUser).toHaveBeenCalledTimes(1);
      expect(mockStorageFrom).toHaveBeenCalledWith(DOCUMENT_BUCKET);
      expect(mockDatabaseFrom).toHaveBeenCalledWith("documents");
    });

    it("should generate the correct storage path", async () => {
      await uploadRegistrationDocument(
          PROFILE_ID,
          createDocument()
      );

      expect(mockRandomUUID).toHaveBeenCalledTimes(1);

      expect(storage.upload).toHaveBeenCalledWith(
          STORAGE_PATH,
          fileBody,
          {
            contentType: "application/pdf",
            upsert: false,
          }
      );
    });

    it("should convert uppercase file extensions to lowercase", async () => {
      await uploadRegistrationDocument(
          PROFILE_ID,
          createDocument({
            name: "MYKAD.PDF",
          })
      );

      expect(storage.upload).toHaveBeenCalledWith(
          STORAGE_PATH,
          fileBody,
          expect.any(Object)
      );
    });

    it("should use the final extension for filenames containing multiple dots", async () => {
      await uploadRegistrationDocument(
          PROFILE_ID,
          createDocument({
            name: "identity.document.PDF",
          })
      );

      expect(storage.upload).toHaveBeenCalledWith(
          STORAGE_PATH,
          fileBody,
          expect.any(Object)
      );
    });

    it("should preserve different file extensions", async () => {
      await uploadRegistrationDocument(
          PROFILE_ID,
          createDocument({
            name: "photo.jpg",
            mimeType: "image/jpeg",
          })
      );

      expect(storage.upload).toHaveBeenCalledWith(
          `${USER_ID}/mykad/${FILE_ID}.jpg`,
          fileBody,
          {
            contentType: "image/jpeg",
            upsert: false,
          }
      );
    });

    it("should use the document type in the storage path", async () => {
      const document = createDocument({
        documentType: "income_proof" as SelectedDocument["documentType"],
      });

      await uploadRegistrationDocument(PROFILE_ID, document);

      expect(storage.upload).toHaveBeenCalledWith(
          `${USER_ID}/income_proof/${FILE_ID}.pdf`,
          fileBody,
          expect.any(Object)
      );
    });

    it("should throw when the filename has no extension", async () => {
      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument({
                name: "mykad",
              })
          )
      ).rejects.toThrow(
          "Unable to determine file extension for mykad."
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it("should throw when the filename is empty", async () => {
      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument({
                name: "",
              })
          )
      ).rejects.toThrow(
          "Unable to determine file extension for ."
      );

      expect(storage.upload).not.toHaveBeenCalled();
    });

    it("should throw when the filename ends with a dot", async () => {
      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument({
                name: "mykad.",
              })
          )
      ).rejects.toThrow(
          "Unable to determine file extension for mykad.."
      );

      expect(storage.upload).not.toHaveBeenCalled();
    });

    it("should throw when authentication fails", async () => {
      mockAuthenticationError("Authentication failed");

      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument()
          )
      ).rejects.toThrow("Authentication failed");

      expect(mockRandomUUID).not.toHaveBeenCalled();
      expect(storage.upload).not.toHaveBeenCalled();
      expect(mockDatabaseFrom).not.toHaveBeenCalled();
    });

    it("should throw when no user is authenticated", async () => {
      mockUnauthenticatedUser();

      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument()
          )
      ).rejects.toThrow(
          "An authenticated user is required to upload documents."
      );

      expect(storage.upload).not.toHaveBeenCalled();
    });

    it("should fetch the selected document URI", async () => {
      const document = createDocument({
        uri: "file:///custom/document.pdf",
      });

      await uploadRegistrationDocument(PROFILE_ID, document);

      expect(mockFetch).toHaveBeenCalledWith(
          "file:///custom/document.pdf"
      );
    });

    it("should upload the fetched ArrayBuffer", async () => {
      const customBody = new ArrayBuffer(16);

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn<() => Promise<ArrayBuffer>>()
            .mockResolvedValue(customBody),
      } as unknown as Response);

      await uploadRegistrationDocument(
          PROFILE_ID,
          createDocument()
      );

      expect(storage.upload).toHaveBeenCalledWith(
          STORAGE_PATH,
          customBody,
          expect.any(Object)
      );
    });

    it("should throw when the document cannot be read", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      } as Response);

      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument()
          )
      ).rejects.toThrow(
          "Unable to read the selected document."
      );

      expect(storage.upload).not.toHaveBeenCalled();
      expect(mockDatabaseFrom).not.toHaveBeenCalled();
    });

    it("should propagate fetch errors", async () => {
      mockFetch.mockRejectedValue(
          new Error("File access failed")
      );

      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument()
          )
      ).rejects.toThrow("File access failed");

      expect(storage.upload).not.toHaveBeenCalled();
    });

    it("should throw when the storage upload fails", async () => {
      storage.upload.mockResolvedValue({
        data: null,
        error: new Error("Storage upload failed"),
      });

      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument()
          )
      ).rejects.toThrow("Storage upload failed");

      expect(mockDatabaseFrom).not.toHaveBeenCalled();
    });

    it("should not insert a database record if storage upload fails", async () => {
      storage.upload.mockResolvedValue({
        data: null,
        error: new Error("Storage failed"),
      });

      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument()
          )
      ).rejects.toThrow("Storage failed");

      expect(databaseQuery.insert).not.toHaveBeenCalled();
    });

    it("should insert the correct document metadata", async () => {
      await uploadRegistrationDocument(
          PROFILE_ID,
          createDocument()
      );

      expect(databaseQuery.insert).toHaveBeenCalledWith({
        profile_id: PROFILE_ID,
        document_type: "mykad",
        original_filename: "mykad.pdf",
        storage_path: STORAGE_PATH,
        mime_type: "application/pdf",
        file_size_bytes: 1024,
      });

      expect(databaseQuery.select).toHaveBeenCalledTimes(1);
      expect(databaseQuery.single).toHaveBeenCalledTimes(1);
    });

    it("should preserve the original filename in the database", async () => {
      await uploadRegistrationDocument(
          PROFILE_ID,
          createDocument({
            name: "MYKAD.PDF",
          })
      );

      expect(databaseQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            original_filename: "MYKAD.PDF",
          })
      );
    });

    it("should preserve the document size", async () => {
      await uploadRegistrationDocument(
          PROFILE_ID,
          createDocument({
            size: 2048,
          })
      );

      expect(databaseQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            file_size_bytes: 2048,
          })
      );
    });

    it("should use the provided profile ID", async () => {
      await uploadRegistrationDocument(
          "another-profile",
          createDocument()
      );

      expect(databaseQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            profile_id: "another-profile",
          })
      );
    });

    it("should remove the uploaded file when database insertion fails", async () => {
      databaseQuery.single.mockResolvedValue({
        data: null,
        error: new Error("Database insert failed"),
      });

      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument()
          )
      ).rejects.toThrow("Database insert failed");

      expect(storage.remove).toHaveBeenCalledWith([
        STORAGE_PATH,
      ]);
    });

    it("should throw the original database error even when cleanup fails", async () => {
      databaseQuery.single.mockResolvedValue({
        data: null,
        error: new Error("Database insert failed"),
      });

      storage.remove.mockResolvedValue({
        data: null,
        error: new Error("Cleanup failed"),
      });

      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument()
          )
      ).rejects.toThrow("Database insert failed");

      expect(storage.remove).toHaveBeenCalledWith([
        STORAGE_PATH,
      ]);
    });

    it("should not remove the uploaded file when database insertion succeeds", async () => {
      await uploadRegistrationDocument(
          PROFILE_ID,
          createDocument()
      );

      expect(storage.remove).not.toHaveBeenCalled();
    });

    it("should use the same storage bucket for upload and cleanup", async () => {
      databaseQuery.single.mockResolvedValue({
        data: null,
        error: new Error("Database insert failed"),
      });

      await expect(
          uploadRegistrationDocument(
              PROFILE_ID,
              createDocument()
          )
      ).rejects.toThrow("Database insert failed");

      expect(mockStorageFrom).toHaveBeenCalledTimes(2);

      expect(mockStorageFrom).toHaveBeenNthCalledWith(
          1,
          DOCUMENT_BUCKET
      );

      expect(mockStorageFrom).toHaveBeenNthCalledWith(
          2,
          DOCUMENT_BUCKET
      );
    });

    it("should return the document record received from Supabase", async () => {
      const customRecord = createDocumentRecord({
        id: "custom-document-id",
      });

      databaseQuery.single.mockResolvedValue({
        data: customRecord,
        error: null,
      });

      const result = await uploadRegistrationDocument(
          PROFILE_ID,
          createDocument()
      );

      expect(result).toEqual(customRecord);
    });
  });

  describe("uploadRegistrationDocuments", () => {
    it("should return empty arrays when no documents are provided", async () => {
      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          []
      );

      expect(result).toEqual({
        uploadedDocuments: [],
        failedDocuments: [],
      });

      expect(mockGetUser).not.toHaveBeenCalled();
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it("should upload a single document successfully", async () => {
      const document = createDocument();

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          [document]
      );

      expect(result.uploadedDocuments).toHaveLength(1);
      expect(result.failedDocuments).toEqual([]);
    });

    it("should upload multiple documents successfully", async () => {
      const documents = [
        createDocument({
          name: "document1.pdf",
        }),
        createDocument({
          name: "document2.pdf",
        }),
      ];

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          documents
      );

      expect(result.uploadedDocuments).toHaveLength(2);
      expect(result.failedDocuments).toEqual([]);

      expect(storage.upload).toHaveBeenCalledTimes(2);
      expect(databaseQuery.insert).toHaveBeenCalledTimes(2);
    });

    it("should preserve the order of successful uploads", async () => {
      const firstRecord = createDocumentRecord({
        id: "document-001",
      });

      const secondRecord = createDocumentRecord({
        id: "document-002",
      });

      databaseQuery.single
          .mockResolvedValueOnce({
            data: firstRecord,
            error: null,
          })
          .mockResolvedValueOnce({
            data: secondRecord,
            error: null,
          });

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          [
            createDocument({
              name: "first.pdf",
            }),
            createDocument({
              name: "second.pdf",
            }),
          ]
      );

      expect(result.uploadedDocuments).toEqual([
        firstRecord,
        secondRecord,
      ]);
    });

    it("should collect failed documents when authentication fails", async () => {
      mockAuthenticationError("Authentication failed");

      const document = createDocument();

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          [document]
      );

      expect(result.uploadedDocuments).toEqual([]);
      expect(result.failedDocuments).toEqual([document]);
    });

    it("should collect failed documents when no user is authenticated", async () => {
      mockUnauthenticatedUser();

      const document = createDocument();

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          [document]
      );

      expect(result.uploadedDocuments).toEqual([]);
      expect(result.failedDocuments).toEqual([document]);
    });

    it("should collect failed documents when storage upload fails", async () => {
      storage.upload.mockResolvedValue({
        data: null,
        error: new Error("Storage failed"),
      });

      const document = createDocument();

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          [document]
      );

      expect(result.uploadedDocuments).toEqual([]);
      expect(result.failedDocuments).toEqual([document]);
    });

    it("should continue uploading after a document fails", async () => {
      storage.upload
          .mockResolvedValueOnce({
            data: null,
            error: new Error("First upload failed"),
          })
          .mockResolvedValueOnce({
            data: {
              path: STORAGE_PATH,
            },
            error: null,
          });

      const firstDocument = createDocument({
        name: "first.pdf",
      });

      const secondDocument = createDocument({
        name: "second.pdf",
      });

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          [
            firstDocument,
            secondDocument,
          ]
      );

      expect(result.failedDocuments).toEqual([
        firstDocument,
      ]);

      expect(result.uploadedDocuments).toHaveLength(1);
      expect(storage.upload).toHaveBeenCalledTimes(2);
    });

    it("should preserve the order of failed documents", async () => {
      storage.upload.mockResolvedValue({
        data: null,
        error: new Error("Storage failed"),
      });

      const firstDocument = createDocument({
        name: "first.pdf",
      });

      const secondDocument = createDocument({
        name: "second.pdf",
      });

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          [
            firstDocument,
            secondDocument,
          ]
      );

      expect(result.failedDocuments).toEqual([
        firstDocument,
        secondDocument,
      ]);
    });

    it("should collect database insertion failures", async () => {
      databaseQuery.single.mockResolvedValue({
        data: null,
        error: new Error("Database insert failed"),
      });

      const document = createDocument();

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          [document]
      );

      expect(result.uploadedDocuments).toEqual([]);
      expect(result.failedDocuments).toEqual([document]);

      expect(storage.remove).toHaveBeenCalledWith([
        STORAGE_PATH,
      ]);
    });

    it("should continue after a database insertion failure", async () => {
      databaseQuery.single
          .mockResolvedValueOnce({
            data: null,
            error: new Error("First insert failed"),
          })
          .mockResolvedValueOnce({
            data: createDocumentRecord({
              id: "document-002",
            }),
            error: null,
          });

      const firstDocument = createDocument({
        name: "first.pdf",
      });

      const secondDocument = createDocument({
        name: "second.pdf",
      });

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          [
            firstDocument,
            secondDocument,
          ]
      );

      expect(result.failedDocuments).toEqual([
        firstDocument,
      ]);

      expect(result.uploadedDocuments).toHaveLength(1);
      expect(storage.upload).toHaveBeenCalledTimes(2);
    });

    it("should handle documents without valid extensions", async () => {
      const invalidDocument = createDocument({
        name: "invalidfile",
      });

      const validDocument = createDocument({
        name: "valid.pdf",
      });

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          [
            invalidDocument,
            validDocument,
          ]
      );

      expect(result.failedDocuments).toEqual([
        invalidDocument,
      ]);

      expect(result.uploadedDocuments).toHaveLength(1);
    });

    it("should handle fetch failures without stopping the batch", async () => {
      mockFetch
          .mockRejectedValueOnce(
              new Error("File access failed")
          )
          .mockResolvedValueOnce({
            ok: true,
            arrayBuffer: jest.fn<() => Promise<ArrayBuffer>>()
                .mockResolvedValue(fileBody),
          } as unknown as Response);

      const firstDocument = createDocument({
        name: "first.pdf",
      });

      const secondDocument = createDocument({
        name: "second.pdf",
      });

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          [
            firstDocument,
            secondDocument,
          ]
      );

      expect(result.failedDocuments).toEqual([
        firstDocument,
      ]);

      expect(result.uploadedDocuments).toHaveLength(1);
    });

    it("should authenticate separately for each document", async () => {
      await uploadRegistrationDocuments(
          PROFILE_ID,
          [
            createDocument({
              name: "first.pdf",
            }),
            createDocument({
              name: "second.pdf",
            }),
            createDocument({
              name: "third.pdf",
            }),
          ]
      );

      expect(mockGetUser).toHaveBeenCalledTimes(3);
    });

    it("should return all documents as failed when every upload fails", async () => {
      storage.upload.mockResolvedValue({
        data: null,
        error: new Error("Storage failed"),
      });

      const documents = [
        createDocument({
          name: "first.pdf",
        }),
        createDocument({
          name: "second.pdf",
        }),
        createDocument({
          name: "third.pdf",
        }),
      ];

      const result = await uploadRegistrationDocuments(
          PROFILE_ID,
          documents
      );

      expect(result.uploadedDocuments).toEqual([]);
      expect(result.failedDocuments).toEqual(documents);
    });
  });
});
