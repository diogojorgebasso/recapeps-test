import React from 'react';
import {
    Box,
    Grid,
    GridItem,
    Icon,
    HStack,
    Heading,
    Link,
} from '@chakra-ui/react';
import { FaBasketballBall, FaRunning } from 'react-icons/fa';
import {
    GiMountainClimbing,
    GiWeightLiftingUp,
    GiStairs,
    GiJuggler,
    GiPingPongBat,
    GiHumanPyramid,
    GiHighPunch
} from 'react-icons/gi';
import { FaPersonDrowning, FaPersonSwimming } from 'react-icons/fa6';

const subjects = [
    { key: 'acrosport', label: 'Acrosport', icon: GiHumanPyramid },
    { key: 'arts-du-cirque', label: 'Arts du Cirque', icon: GiJuggler },
    { key: 'basket', label: 'Basket', icon: FaBasketballBall },
    { key: 'escalade', label: 'Escalade', icon: GiMountainClimbing },
    { key: 'lutte', label: 'Lutte', icon: GiHighPunch },
    { key: 'musculation', label: 'Musculation', icon: GiWeightLiftingUp },
    { key: 'natation-vitesse', label: 'Natation Vitesse', icon: FaPersonSwimming },
    { key: 'relais-vitesse', label: 'Relais Vitesse', icon: FaRunning },
    { key: 'savoir-nager', label: 'Savoir Nager', icon: FaPersonDrowning },
    { key: 'step', label: 'Step', icon: GiStairs },
    { key: 'tennis-de-table', label: 'Tennis de Table', icon: GiPingPongBat },
];

export default function SubjectList() {
    return (
        <Box p={{ base: 4, md: 8 }}>
            <Heading mb={{ base: 4, md: 6 }}>Nos disciplines</Heading>
            <Grid
                templateColumns={{ base: '1fr', md: 'repeat(auto-fit, minmax(180px, 1fr))' }}
                gap={{ base: 4, md: 6 }}
            >
                {subjects.map(({ key, label, icon: IconComponent }) => (
                    <GridItem key={key}>
                        <Box
                            bgGradient="to-br"
                            gradientFrom="teal.500"
                            gradientTo="blue.500"
                            p={{ base: 3, md: 6 }}
                            borderRadius={{ base: 'lg', md: 'xl' }}
                            boxShadow={{ base: 'sm', md: 'md' }}
                            _hover={{
                                transform: { md: 'translateY(-4px)' },
                                boxShadow: { md: 'lg' },
                            }}
                            transition="all 0.2s ease"
                        >
                            <HStack gap={3} align="center">
                                <IconComponent />
                                <Link href={`/parcours/oral-1/${key}`} fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">
                                    {label}
                                </Link>
                            </HStack>
                        </Box>
                    </GridItem>
                ))}
            </Grid>
        </Box>
    );
}