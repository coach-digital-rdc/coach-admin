import React from 'react';
import { Box, Center, HStack, Skeleton, SkeletonCircle, Text, VStack } from '@chakra-ui/react';
import Icon from '../Base/Icon';

export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  description?: string | null;
  action?: React.ReactNode;
}> = ({ icon = 'inbox', title, description, action }) => (
  <VStack py={12} px={6} spacing={3} textAlign="center">
    <Center w="64px" h="64px" borderRadius="20px" bg="ink.100">
      <Icon name={icon} size={30} color="#9AA2AC" />
    </Center>
    <Text fontSize="16px" fontWeight={700} color="ink.800">
      {title}
    </Text>
    {description && (
      <Text fontSize="14px" color="ink.500" maxW="420px">
        {description}
      </Text>
    )}
    {action}
  </VStack>
);

export const SkeletonRows: React.FC<{ rows?: number; columns?: number }> = ({ rows = 6, columns = 5 }) => (
  <Box px={5} py={2}>
    {Array.from({ length: rows }).map((_, row) => (
      <HStack key={row} py={3.5} spacing={5} borderBottom={row < rows - 1 ? '1px solid' : 'none'} borderColor="ink.100">
        <SkeletonCircle size="8" flex="none" />
        {Array.from({ length: columns }).map((__, column) => (
          <Skeleton key={column} h="12px" flex={column === 0 ? 2 : 1} borderRadius="6px" />
        ))}
      </HStack>
    ))}
  </Box>
);

