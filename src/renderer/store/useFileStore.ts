import { create } from 'zustand';
import { PDFDocument } from '../services/FileImportService';

interface FileStore {
  documents: PDFDocument[];
  selectedDocumentId: string | null;
  isLoading: boolean;
  
  // Actions
  addDocuments: (documents: PDFDocument[]) => void;
  removeDocument: (id: string) => void;
  selectDocument: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearDocuments: () => void;
  
  // Computed properties
  selectedFile: File | null;
  selectedDocument: PDFDocument | null;
}

export const useFileStore = create<FileStore>((set, get) => ({
  documents: [],
  selectedDocumentId: null,
  isLoading: false,

  addDocuments: (documents) =>
    set((state) => ({
      documents: [...state.documents, ...documents],
    })),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
      selectedDocumentId: state.selectedDocumentId === id ? null : state.selectedDocumentId,
    })),

  selectDocument: (id) =>
    set(() => ({
      selectedDocumentId: id,
    })),

  setLoading: (loading) =>
    set(() => ({
      isLoading: loading,
    })),

  clearDocuments: () =>
    set(() => ({
      documents: [],
      selectedDocumentId: null,
    })),

  // Computed properties
  get selectedFile() {
    const state = get();
    const selectedDoc = state.documents.find(doc => doc.id === state.selectedDocumentId);
    return selectedDoc?.file || null;
  },

  get selectedDocument() {
    const state = get();
    return state.documents.find(doc => doc.id === state.selectedDocumentId) || null;
  },
}));
