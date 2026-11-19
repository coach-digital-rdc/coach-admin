import React, { useEffect, useMemo, useState } from 'react';
import { HStack, Select } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import RegionService from '@/services/region';
import { IRegion } from '@/types';
import { useUserContext } from '@/contexts/UserContext';
import { Period } from '@/services/rdc';

const LEVELS = 3;
let treeCache: Promise<IRegion[]> | undefined;

// Province, PROVED and Sous-PROVED; the levels of the region of the user are fixed
export const RegionFilter: React.FC<{ onChange: (regionId?: string) => void }> = ({ onChange }) => {
  const { t } = useTranslation();
  const { userRegionsPath } = useUserContext();
  const [tree, setTree] = useState<IRegion[]>([]);
  const [selected, setSelected] = useState<(string | undefined)[]>([]);

  useEffect(() => {
    treeCache = treeCache || RegionService.getRegionsTree();
    treeCache.then(setTree).catch(() => (treeCache = undefined));
  }, []);

  const fixed = userRegionsPath.map((region) => region.id as string);
  const path = useMemo(() => [...fixed, ...selected.slice(fixed.length)], [fixed.join(), selected]);

  const options = (level: number): IRegion[] => {
    let list = tree;
    for (let index = 0; index < level; index++) {
      const parent = list.find((region) => region.id === path[index]);
      if (!parent) return [];
      list = parent.children || [];
    }
    return list;
  };

  const choose = (level: number, id?: string) => {
    const next = [...path.slice(0, level), id];
    setSelected(next);
    onChange(next.filter(Boolean).pop() || fixed[fixed.length - 1]);
  };

  return (
    <HStack spacing={2} flexWrap="wrap">
      {Array.from({ length: LEVELS }).map((_, level) => {
        const list = options(level);
        if (level > 0 && (!path[level - 1] || list.length === 0)) return null;
        return (
          <Select
            key={level}
            size="md"
            w={{ base: 'full', md: '200px' }}
            value={path[level] || ''}
            isDisabled={level < fixed.length}
            onChange={(event) => choose(level, event.target.value || undefined)}
            aria-label={t(`ui.region-levels.${level}`) || ''}
          >
            <option value="">{t(`ui.region-all.${level}`)}</option>
            {list.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </Select>
        );
      })}
    </HStack>
  );
};

export type PeriodKey = 'all' | '30' | '90' | 'school-year' | 'last-school-year';

// The school year of the DRC starts in September
export const periodOf = (key: PeriodKey): Period | undefined => {
  const now = new Date();
  if (key === 'all') return undefined;
  if (key === '30' || key === '90') {
    const start = new Date(now);
    start.setDate(start.getDate() - Number(key));
    return { startDate: start, endDate: now };
  }
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  if (key === 'school-year') return { startDate: new Date(startYear, 8, 1), endDate: now };
  return { startDate: new Date(startYear - 1, 8, 1), endDate: new Date(startYear, 8, 1) };
};

export const PeriodFilter: React.FC<{ value: PeriodKey; onChange: (value: PeriodKey) => void }> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  return (
    <Select
      w={{ base: 'full', md: '250px' }}
      value={value}
      onChange={(event) => onChange(event.target.value as PeriodKey)}
      aria-label={t('ui.period') || ''}
    >
      {(['all', '30', '90', 'school-year', 'last-school-year'] as PeriodKey[]).map((key) => (
        <option key={key} value={key}>
          {t(`ui.periods.${key}`)}
        </option>
      ))}
    </Select>
  );
};
