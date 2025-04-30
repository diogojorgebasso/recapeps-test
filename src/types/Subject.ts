export interface SubjectNote {
    id: string;
    name: string;
    image: string;
    premium: boolean;
    evaluation: number; // 1 for ecrit-1, 2 for ecrit-2
    link: string;
}