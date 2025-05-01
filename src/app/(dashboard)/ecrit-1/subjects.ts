import { Subject } from '@/types/Subject';

export const subjects: Subject[] = [
    // —— existing three ——
    { id: 'travail-eleves', name: 'Travail des élèves', image: '/img/travail.jpg', premium: false },
    { id: 'les-techniques', name: 'Les techniques', image: '/img/techniques.jpg', premium: false },
    { id: 'sport-scolaire', name: 'Sport scolaire', image: '/img/sport.jpg', premium: false },
    { id: 'sciences', name: 'Sciences', image: '/img/sciences.jpg', premium: false },
    { id: 'sante', name: 'Santé', image: '/img/sante.jpg', premium: false },
    { id: 'nature-citoyennete', name: 'Nature et citoyenneté', image: '/img/nature.jpg', premium: false },
    { id: 'mutations-systeme', name: 'Mutations du système éducatif', image: '/img/mutations.jpg', premium: true },
    { id: 'mixite-sexuee', name: 'La mixité sexuée', image: '/img/mixite.jpg', premium: true },
    {
        id: 'evaluation', name: 'Evaluation', image: '/img/evaluation.jpg', premium: true
    },
    { id: 'culture-corporelle', name: 'Culture corporelle', image: '/img/culture-corporelle.jpg', premium: true },
];