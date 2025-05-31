import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, TextFieldProps } from '@mui/material';
import { getItemGroupSuggestions } from '../services/itemGroupService';

interface ItemGroupAutocompleteProps {
  groupLevel: 1 | 2 | 3;
  value: string;
  onChange: (value: string) => void;
  textFieldProps?: Partial<TextFieldProps>;
}

const ItemGroupAutocomplete: React.FC<ItemGroupAutocompleteProps> = ({
  groupLevel,
  value,
  onChange,
  textFieldProps = {},
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true);
      try {
        const suggestionList = await getItemGroupSuggestions(groupLevel);
        setSuggestions(suggestionList);
      } catch (error) {
        console.error('품목그룹 제안 목록 로딩 실패:', error);
        setSuggestions([]); // 에러 시 빈 배열로 설정
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, [groupLevel]);

  const getLabel = () => {
    switch (groupLevel) {
      case 1: return '품목 그룹 1';
      case 2: return '품목 그룹 2';
      case 3: return '품목 그룹 3';
      default: return '품목 그룹';
    }
  };

  const getPlaceholder = () => {
    switch (groupLevel) {
      case 1: return '예: 엔진부품';
      case 2: return '예: 브레이크';
      case 3: return '예: 패드';
      default: return '품목 그룹을 입력하세요';
    }
  };

  return (
    <Autocomplete
      freeSolo
      options={suggestions}
      value={value}
      onChange={(event, newValue) => {
        onChange(newValue || '');
      }}
      onInputChange={(event, newInputValue) => {
        onChange(newInputValue);
      }}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          {...textFieldProps}
          label={getLabel()}
          placeholder={getPlaceholder()}
          helperText={
            suggestions.length > 0 
              ? `${suggestions.length}개의 제안 항목이 있습니다` 
              : '새로운 품목그룹을 입력하면 자동으로 저장됩니다'
          }
        />
      )}
      sx={{ width: '100%' }}
    />
  );
};

export default ItemGroupAutocomplete; 