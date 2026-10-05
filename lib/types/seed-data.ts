export type SeedChoice = {
    text: string;
    isCorrect: boolean;
};

export type SeedQuestion = {
    number: number;
    text: string;
    instruction?: string;
    choices: SeedChoice[];
    audioFilename?: string; // Optional reference to a file in public/audio/
    imageFilename?: string; // Optional reference to a file in public/images/
};

export type SeedSection = {
    type: 'vocab' | 'reading' | 'listening';
    title: string;
    order: number;
    passageTitle?: string;
    passageContent?: string; // HTML allowed
    questions: SeedQuestion[];
};

export type SeedExam = {
    level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
    year: number;
    session: 'July' | 'December';
    sections: SeedSection[];
};
