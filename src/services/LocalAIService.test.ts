import { jest } from '@jest/globals';

jest.mock('expo-file-system', () => ({
    getInfoAsync: jest.fn(),
    makeDirectoryAsync: jest.fn(),
    createDownloadResumable: jest.fn(),
    readAsStringAsync: jest.fn(),
    deleteAsync: jest.fn(),
    documentDirectory: 'file:///data/',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        setItem: jest.fn(),
        removeItem: jest.fn(),
        getItem: jest.fn(),
    },
}));

jest.mock('onnxruntime-react-native', () => ({
    InferenceSession: {
        create: jest.fn(),
    },
    Tensor: jest.fn(),
}));

jest.mock('@xenova/transformers', () => ({
    GemmaTokenizer: jest.fn(),
}));

jest.mock('react-native', () => ({
    NativeModules: {
        LocalAI: null, // Mock native module missing
    },
    Platform: {
        OS: 'ios',
    },
}));

describe('LocalAIService', () => {
    let LocalAIService: any;
    let FileSystem: any;
    let AsyncStorage: any;
    let InferenceSession: any;
    let Tensor: any;
    let GemmaTokenizer: any;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        FileSystem = require('expo-file-system');
        AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const ORT = require('onnxruntime-react-native');
        InferenceSession = ORT.InferenceSession;
        Tensor = ORT.Tensor;
        GemmaTokenizer = require('@xenova/transformers').GemmaTokenizer;

        LocalAIService = require('./LocalAIService').LocalAIService;
    });

    it('should download model and tokenizer files', async () => {
        FileSystem.getInfoAsync.mockResolvedValue({ exists: false });
        FileSystem.makeDirectoryAsync.mockResolvedValue(undefined);
        const mockDownloadAsync = jest.fn().mockResolvedValue({ uri: 'file://model.onnx' });
        FileSystem.createDownloadResumable.mockReturnValue({
            downloadAsync: mockDownloadAsync,
        });

        await LocalAIService.downloadModel();

        expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
        expect(FileSystem.createDownloadResumable).toHaveBeenCalledTimes(3); // 2 tokenizer files + 1 model
        expect(mockDownloadAsync).toHaveBeenCalledTimes(3);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('@local_ai_model_installed', 'true');
    });

    it('should check if model is installed', async () => {
        FileSystem.getInfoAsync.mockResolvedValue({ exists: true });

        const result = await LocalAIService.isModelInstalled();

        expect(result).toBe(true);
        expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(3);
    });

    it('should delete model files', async () => {
        await LocalAIService.deleteModel();

        expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(3);
        expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should summarize using ONNX model when installed', async () => {
        // Mock installation check
        FileSystem.getInfoAsync.mockResolvedValue({ exists: true });

        // Mock loading resources
        FileSystem.readAsStringAsync.mockResolvedValue('{}'); // Tokenizer JSONs

        const mockDecode = jest.fn().mockReturnValue('Summarized text');
        const mockTokenizerFunc = jest.fn().mockReturnValue({ input_ids: [1, 2, 3] });

        // We need to attach properties to the function to mock GemmaTokenizer instance
        const mockTokenizerInstance = Object.assign(mockTokenizerFunc, {
            decode: mockDecode,
            eos_token_id: 1,
        });

        GemmaTokenizer.mockImplementation(() => mockTokenizerInstance);

        const mockSession = {
            run: jest.fn().mockResolvedValue({
                logits: {
                    dims: [1, 3, 10], // batch, seq_len, vocab
                    data: new Float32Array(30), // dummy data
                }
            })
        };
        InferenceSession.create.mockResolvedValue(mockSession);

        Tensor.mockImplementation(() => ({}));

        const result = await LocalAIService.summarize('Test text');

        expect(InferenceSession.create).toHaveBeenCalled();
        expect(mockSession.run).toHaveBeenCalled();
        expect(mockTokenizerInstance).toHaveBeenCalled();
        expect(result.provider).toBe('gemma');
        expect(result.summary).toContain('Summarized text');
        expect(result.summary).toContain('Résumé de ta mois');
    });
});
