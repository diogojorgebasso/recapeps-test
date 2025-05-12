import { Question } from "@/types/HomeQuiz";

const quiz1Questions: Question[] = [
    {
        question: "L'OMS définit la santé comme un bien-être :",
        options: [
            "Physique, mental, social",
            "Physique, psychologique, familial",
            "Familial, amical, personnel",
            "Psychologique, moteur, social",
        ],
        correctAnswer: "Physique, mental, social",
    },
    {
        question: "Jusqu'aux années 60, la santé est principalement considérée comme :",
        options: ["Physique", "Mentale", "Sociale", "Psychologique"],
        correctAnswer: "Physique",
    },
    {
        question: "Les groupes d'élèves établis avec les IO de 1945 prennent en compte la santé :",
        options: ["Motrice", "Physiologique", "Psychologique", "Sociale"],
        correctAnswer: "Physiologique",
    },
    {
        question: "Les Lendits, relancés dans les années 1930, étaient :",
        options: [
            "Des compétitions sportives scolaires",
            "Des activités centrées sur les sports de combat",
            "Des rassemblements collectifs de plein air",
            "Des épreuves exclusivement médicales",
        ],
        correctAnswer: "Des rassemblements collectifs de plein air",
    },
    {
        question: "Le rapport d'Helsinki (1999) souligne que l'activité physique :",
        options: [
            "Doit être réservée à l'élite sportive",
            "A une importance pour la santé, l'éducation et la culture",
            "Doit être centrée sur les capacités physiques individuelles",
            "Est uniquement une pratique compétitive",
        ],
        correctAnswer: "A une importance pour la santé, l'éducation et la culture",
    },
];

export default quiz1Questions;
