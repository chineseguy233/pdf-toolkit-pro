export interface ElectronAPI {
    getVersion: () => Promise<string>;
    openFileDialog: () => Promise<Electron.OpenDialogReturnValue>;
    saveFileDialog: (defaultPath: string) => Promise<Electron.SaveDialogReturnValue>;
    onMenuAction: (callback: (action: string) => void) => void;
    removeAllListeners: (channel: string) => void;
}
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
