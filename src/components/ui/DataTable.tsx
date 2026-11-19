import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Icon from '../Base/Icon';
import { EmptyState, SkeletonRows } from './feedback';

export type DataColumn<T> = {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  // Value used to sort the column; the column cannot be sorted without it
  sortValue?: (item: T) => string | number | null | undefined;
  width?: string;
  align?: 'left' | 'right' | 'center';
  hideBelow?: 'md' | 'lg';
};

type Props<T> = {
  data: T[];
  columns: DataColumn<T>[];
  isLoading?: boolean;
  // Text searched by the search field; no search field without it
  searchText?: (item: T) => string;
  searchPlaceholder?: string | null;
  toolbar?: React.ReactNode;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string;
  emptyTitle?: string | null;
  emptyDescription?: string | null;
  emptyIcon?: string;
  initialSort?: { key: string; direction: 'asc' | 'desc' };
  pageSize?: number;
};

const PAGE_SIZES = [10, 20, 50, 100];

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function DataTable<T>({
  data,
  columns,
  isLoading,
  searchText,
  searchPlaceholder,
  toolbar,
  onRowClick,
  rowKey,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  initialSort,
  pageSize: initialPageSize = 20,
}: Props<T>) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const rows = useMemo(() => {
    const words = normalize(search).split(/\s+/).filter(Boolean);
    const filtered =
      searchText && words.length
        ? data.filter((item) => {
            const text = normalize(searchText(item));
            return words.every((word) => text.includes(word));
          })
        : data;
    const column = columns.find((item) => item.key === sort?.key);
    if (!column?.sortValue || !sort) return filtered;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const valueA = column.sortValue!(a);
      const valueB = column.sortValue!(b);
      if (valueA === valueB) return 0;
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;
      if (typeof valueA === 'number' && typeof valueB === 'number') return (valueA - valueB) * factor;
      return `${valueA}`.localeCompare(`${valueB}`, undefined, { numeric: true }) * factor;
    });
  }, [data, search, sort, columns, searchText]);

  useEffect(() => setPage(0), [search, data, pageSize]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (key: string) =>
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );

  return (
    <Box bg="white" borderRadius="card" border="1px solid" borderColor="ink.200" boxShadow="card" overflow="hidden">
      {(searchText || toolbar) && (
        <Flex
          px={4}
          py={3}
          gap={3}
          borderBottom="1px solid"
          borderColor="ink.100"
          direction={{ base: 'column', lg: 'row' }}
          align={{ base: 'stretch', lg: 'center' }}
        >
          {searchText && (
            <InputGroup maxW={{ lg: '320px' }}>
              <InputLeftElement pointerEvents="none">
                <Icon name="search" size={18} color="#9AA2AC" />
              </InputLeftElement>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder || t('ui.search') || ''}
                aria-label={searchPlaceholder || t('ui.search') || ''}
              />
            </InputGroup>
          )}
          {toolbar && (
            <HStack spacing={2} flex={1} flexWrap="wrap" justify={{ lg: 'flex-end' }}>
              {toolbar}
            </HStack>
          )}
        </Flex>
      )}

      {isLoading ? (
        <SkeletonRows columns={Math.min(columns.length, 5)} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={search ? t('ui.no-result') : emptyTitle || t('ui.empty')}
          description={search ? t('ui.no-result-description') : emptyDescription}
        />
      ) : (
        <Box overflowX="auto">
          <Table size="md">
            <Thead bg="ink.50">
              <Tr>
                {columns.map((column) => (
                  <Th
                    key={column.key}
                    w={column.width}
                    textAlign={column.align || 'left'}
                    display={column.hideBelow ? { base: 'none', [column.hideBelow]: 'table-cell' } : undefined}
                    color="ink.600"
                    fontSize="12px"
                    letterSpacing="0.04em"
                    textTransform="none"
                    fontWeight={700}
                    py={3}
                    borderColor="ink.100"
                    whiteSpace="nowrap"
                  >
                    {column.sortValue ? (
                      <HStack
                        as="button"
                        spacing={1}
                        onClick={() => toggleSort(column.key)}
                        color={sort?.key === column.key ? 'brand.600' : undefined}
                        aria-label={`${t('ui.sort-by')} ${column.header}`}
                        justify={column.align === 'right' ? 'flex-end' : 'flex-start'}
                        w="full"
                      >
                        <span>{column.header}</span>
                        <Icon
                          name={sort?.key === column.key && sort.direction === 'desc' ? 'arrow-down' : 'arrow-up'}
                          size={14}
                          color={sort?.key === column.key ? '#0052A3' : '#C7CBD1'}
                        />
                      </HStack>
                    ) : (
                      column.header
                    )}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {visible.map((item) => (
                <Tr
                  key={rowKey(item)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  cursor={onRowClick ? 'pointer' : undefined}
                  _hover={onRowClick ? { bg: 'brand.50' } : { bg: 'ink.50' }}
                  transition="background 120ms"
                >
                  {columns.map((column) => (
                    <Td
                      key={column.key}
                      textAlign={column.align || 'left'}
                      display={column.hideBelow ? { base: 'none', [column.hideBelow]: 'table-cell' } : undefined}
                      fontSize="14px"
                      color="ink.800"
                      borderColor="ink.100"
                      py={3}
                    >
                      {column.render(item)}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {!isLoading && rows.length > 0 && (
        <Flex
          px={4}
          py={3}
          gap={3}
          align="center"
          borderTop="1px solid"
          borderColor="ink.100"
          direction={{ base: 'column', sm: 'row' }}
        >
          <Text fontSize="13px" color="ink.500" flex={1}>
            {t('ui.showing', {
              from: page * pageSize + 1,
              to: Math.min(rows.length, (page + 1) * pageSize),
              total: rows.length,
            })}
          </Text>
          <HStack spacing={2}>
            <Select
              size="sm"
              w="auto"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              aria-label={t('ui.page-size') || ''}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {t('ui.per-page', { count: size })}
                </option>
              ))}
            </Select>
            <IconButton
              size="sm"
              variant="outline"
              aria-label={t('ui.previous')}
              icon={<Icon name="angle-left" size={18} color="#3A4250" />}
              isDisabled={page === 0}
              onClick={() => setPage(page - 1)}
            />
            <Button size="sm" variant="ghost" pointerEvents="none" fontWeight={600} color="ink.700">
              {page + 1} / {pageCount}
            </Button>
            <IconButton
              size="sm"
              variant="outline"
              aria-label={t('ui.next')}
              icon={<Icon name="angle-right" size={18} color="#3A4250" />}
              isDisabled={page >= pageCount - 1}
              onClick={() => setPage(page + 1)}
            />
          </HStack>
        </Flex>
      )}
    </Box>
  );
}

export default DataTable;
