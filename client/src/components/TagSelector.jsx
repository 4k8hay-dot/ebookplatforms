import { useEffect, useState } from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';
import { getMyTagsRequest, createTagRequest } from '../api/tagApi';

/**
 * value: array of tag objects ({_id, name}) currently selected.
 * onChange: called with the updated array of tag objects.
 * Typing a name that doesn't exist yet and pressing Enter creates it via
 * POST /api/tags, then adds it to the selection — this is the "custom
 * tags" creation flow for FR-TAG-02.
 */
export default function TagSelector({ value, onChange, label = 'Tags' }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    getMyTagsRequest()
      .then((res) => setOptions(res.data.data.tags))
      .catch(() => setOptions([]));
  }, []);

  const handleChange = async (_e, newValue) => {
    // newValue can contain plain strings (freeSolo typed entries) mixed
    // with existing tag objects — resolve any strings into real tags.
    const resolved = await Promise.all(
      newValue.map(async (item) => {
        if (typeof item !== 'string') return item;
        const existing = options.find((o) => o.name.toLowerCase() === item.toLowerCase());
        if (existing) return existing;
        const res = await createTagRequest(item);
        const created = res.data.data.tag;
        setOptions((prev) => [...prev, created]);
        return created;
      })
    );
    onChange(resolved);
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      size="small"
      options={options}
      value={value}
      isOptionEqualToValue={(o, v) => o._id === v._id}
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
      onChange={handleChange}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => <Chip size="small" label={typeof option === 'string' ? option : option.name} {...getTagProps({ index })} />)
      }
      renderInput={(params) => <TextField {...params} label={label} placeholder="Type and press enter" />}
    />
  );
}
