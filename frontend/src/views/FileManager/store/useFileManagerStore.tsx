import { create } from 'zustand'
import type { Files, Layout, StorageUsage, FileItem } from '../types'

type DialogProps = { id: string; name?: string; open: boolean }

export type FileManagerState = {
    fileList: Files
    layout: Layout
    selectedFile: string
    storageUsage: StorageUsage | null
    deleteDialog: DialogProps
    inviteDialog: DialogProps & { url?: string }
    renameDialog: DialogProps
}

type FileManagerAction = {
    setFileList: (payload: Files) => void
    setLayout: (payload: Layout) => void
    setSelectedFile: (payload: string) => void
    setStorageUsage: (payload: StorageUsage | null) => void
    setDeleteDialog: (payload: DialogProps) => void
    setInviteDialog: (payload: DialogProps & { url?: string }) => void
    setRenameDialog: (payload: DialogProps) => void
    deleteFile: (payload: string) => void
    renameFile: (payload: { id: string; fileName: string }) => void
    appendFiles: (payload: FileItem[]) => void
}

const initialState: FileManagerState = {
    fileList: [],
    layout: 'list',
    selectedFile: '',
    storageUsage: null,
    deleteDialog: { open: false, id: '' },
    inviteDialog: { open: false, id: '', url: '' },
    renameDialog: { open: false, id: '', name: '' },
}

export const useFileManagerStore = create<FileManagerState & FileManagerAction>(
    (set, get) => ({
        ...initialState,
        setFileList: (payload) => set(() => ({ fileList: payload })),
        setLayout: (payload: Layout) => set(() => ({ layout: payload })),
        setSelectedFile: (payload) => set(() => ({ selectedFile: payload })),
        setStorageUsage: (payload) => set(() => ({ storageUsage: payload })),
        setDeleteDialog: (payload) => set(() => ({ deleteDialog: payload })),
        setInviteDialog: (payload) => set(() => ({ inviteDialog: payload })),
        setRenameDialog: (payload) => set(() => ({ renameDialog: payload })),
        deleteFile: (payload) =>
            set(() => ({
                fileList: get().fileList.filter((file) => file.id !== payload),
                selectedFile: get().selectedFile === payload ? '' : get().selectedFile,
            })),
        renameFile: (payload) =>
            set(() => ({
                fileList: get().fileList.map((file) => {
                    if (file.id === payload.id) {
                        return {
                            ...file,
                            name: payload.fileName,
                        }
                    }
                    return file
                }),
            })),
        appendFiles: (payload) =>
            set(() => ({
                fileList: [...payload, ...get().fileList],
            })),
    }),
)
