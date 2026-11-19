import React from 'react';
import {
  Badge,
  Box,
  BoxProps,
  Center,
  Flex,
  HStack,
  Skeleton,
  SkeletonCircle,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  keyframes,
} from '@chakra-ui/react';
import Icon from '../Base/Icon';
import { usePendingRequests } from '@/common/progress';

export { default as DataTable } from './DataTable';
export { EmptyState, SkeletonRows } from './feedback';
export type { DataColumn } from './DataTable';

// Page of the administration: title, description and the main actions on the right
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string | null;
  eyebrow?: string | null;
  actions?: React.ReactNode;
}> = ({ title, subtitle, eyebrow, actions }) => (
  <Flex
    w="full"
    mb={{ base: 5, md: 7 }}
    gap={4}
    direction={{ base: 'column', xl: 'row' }}
    align={{ base: 'stretch', xl: 'flex-end' }}
  >
    <Box flex={1} minW={0}>
      {eyebrow && (
        <Text fontSize="12px" fontWeight={700} letterSpacing="0.06em" color="brand.500" textTransform="uppercase">
          {eyebrow}
        </Text>
      )}
      <Text as="h1" fontSize={{ base: '24px', md: '28px' }} fontWeight={700} color="ink.900" lineHeight={1.2}>
        {title}
      </Text>
      {subtitle && (
        <Text mt={1.5} fontSize="15px" color="ink.600" maxW="720px">
          {subtitle}
        </Text>
      )}
    </Box>
    {actions && (
      <HStack spacing={2} flexWrap="wrap" justify={{ base: 'flex-start', xl: 'flex-end' }}>
        {actions}
      </HStack>
    )}
  </Flex>
);

export const Card: React.FC<BoxProps> = ({ children, ...props }) => (
  <Box bg="white" borderRadius="card" border="1px solid" borderColor="ink.200" boxShadow="card" {...props}>
    {children}
  </Box>
);

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string | null;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <HStack px={5} pt={5} pb={3} align="flex-start" spacing={3}>
    <Box flex={1} minW={0}>
      <Text fontSize="16px" fontWeight={700} color="ink.900">
        {title}
      </Text>
      {subtitle && (
        <Text fontSize="13px" color="ink.500" mt={0.5}>
          {subtitle}
        </Text>
      )}
    </Box>
    {action}
  </HStack>
);

const TONES = {
  brand: { bg: 'brand.50', fg: '#3373CC' },
  green: { bg: '#EFFBEF', fg: '#218225' },
  yellow: { bg: '#FEF8EC', fg: '#9B6908' },
  violet: { bg: '#F5ECFE', fg: '#52089B' },
  red: { bg: '#FEEDEC', fg: '#9B1208' },
  teal: { bg: '#F0FAFA', fg: '#297A7A' },
};
export type Tone = keyof typeof TONES;

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: string;
  hint?: React.ReactNode;
  tone?: Tone;
  isLoading?: boolean;
}> = ({ label, value, icon, hint, tone = 'brand', isLoading }) => (
  <Card p={5}>
    <HStack spacing={4} align="flex-start">
      <Center w="44px" h="44px" borderRadius="12px" bg={TONES[tone].bg} flex="none">
        <Icon name={icon} size={22} color={TONES[tone].fg} />
      </Center>
      <Box minW={0}>
        <Text fontSize="13px" color="ink.600" fontWeight={500}>
          {label}
        </Text>
        <Skeleton isLoaded={!isLoading} mt={1} minH="34px" borderRadius="8px">
          <Text fontSize="28px" fontWeight={700} color="ink.900" lineHeight="34px">
            {value}
          </Text>
        </Skeleton>
        {hint && !isLoading && (
          <Text fontSize="12px" color="ink.500" mt={1}>
            {hint}
          </Text>
        )}
      </Box>
    </HStack>
  </Card>
);

export const SkeletonCards: React.FC<{ count?: number; height?: string }> = ({ count = 4, height = '96px' }) => (
  <SimpleGrid w="full" columns={{ base: 1, sm: 2, xl: count }} spacing={4}>
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton key={index} h={height} borderRadius="card" />
    ))}
  </SimpleGrid>
);

const spin = keyframes`to { transform: rotate(360deg); }`;

// Loader of a whole page or of a panel
export const PageLoader: React.FC<{ label?: string | null }> = ({ label }) => (
  <Center w="full" py={20} flexDir="column" gap={4}>
    <Box position="relative" w="48px" h="48px">
      <Box position="absolute" inset={0} borderRadius="50%" border="4px solid" borderColor="brand.50" />
      <Box
        position="absolute"
        inset={0}
        borderRadius="50%"
        border="4px solid transparent"
        borderTopColor="brand.500"
        borderRightColor="brand.300"
        animation={`${spin} 0.8s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite`}
      />
    </Box>
    {label && (
      <Text fontSize="14px" color="ink.500">
        {label}
      </Text>
    )}
  </Center>
);

export const InlineLoader = () => <Spinner size="sm" thickness="3px" speed="0.7s" emptyColor="brand.50" />;

const slide = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
`;

// Thin bar at the top of the window while requests are running
export const TopProgress: React.FC = () => {
  const pending = usePendingRequests();
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      h="3px"
      zIndex={2000}
      overflow="hidden"
      pointerEvents="none"
      opacity={pending > 0 ? 1 : 0}
      transition="opacity 300ms"
      bg="brand.50"
    >
      <Box
        h="full"
        w="30%"
        bgGradient="linear(to-r, brand.300, brand.500, brand.300)"
        borderRadius="full"
        animation={pending > 0 ? `${slide} 1.1s ease-in-out infinite` : undefined}
      />
    </Box>
  );
};

const BADGE_COLORS: { [tone: string]: [string, string] } = {
  green: ['#EFFBEF', '#218225'],
  yellow: ['#FEF8EC', '#9B6908'],
  red: ['#FEEDEC', '#9B1208'],
  brand: ['#EBF5FF', '#0052A3'],
  gray: ['#F2F4F7', '#576375'],
  violet: ['#F5ECFE', '#52089B'],
};

export const StatusBadge: React.FC<{ tone?: keyof typeof BADGE_COLORS; children: React.ReactNode }> = ({
  tone = 'gray',
  children,
}) => (
  <Badge bg={BADGE_COLORS[tone][0]} color={BADGE_COLORS[tone][1]} fontSize="12px" whiteSpace="nowrap">
    {children}
  </Badge>
);

// Score out of 5, coloured like the global scores of the mobile application
export const ScorePill: React.FC<{ value?: number | null; max?: number }> = ({ value, max = 5 }) => {
  if (value === null || value === undefined) return <Text color="ink.400">—</Text>;
  const tone = value >= 3.5 ? 'green' : value >= 2.5 ? 'yellow' : 'red';
  return (
    <StatusBadge tone={tone}>
      {value.toLocaleString(undefined, { maximumFractionDigits: 1 })} / {max}
    </StatusBadge>
  );
};

export const InfoItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <Box minW={0}>
    <Text fontSize="12px" fontWeight={600} color="ink.500" textTransform="uppercase" letterSpacing="0.04em">
      {label}
    </Text>
    <Text mt={1} fontSize="15px" color="ink.900" fontWeight={500} wordBreak="break-word">
      {value === undefined || value === null || value === '' ? '—' : value}
    </Text>
  </Box>
);
