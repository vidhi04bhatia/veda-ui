import React, { useState } from 'react';
import styled from 'styled-components';
import { DatePicker } from '@trussworks/react-uswds';
import { glsp, themeVal } from '@devseed-ui/theme-provider';
import { TipButton } from '../tip-button';

const DatePickerButton = styled(TipButton)`
  gap: ${glsp(0.5)};

  .head-reference {
    font-weight: ${themeVal('type.base.regular')};
    color: ${themeVal('color.base-400')};
    font-size: 0.875rem;
  }
`;

const Icon = styled.span`
  display: inline-block;
`;

function USWDSDatePicker({ value, onChange, id, ariaLabel, size, disabled }) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date) => date ? date.toLocaleDateString() : 'Select date';

  return (
    <div>
      <DatePickerButton
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        size={size}
        disabled={disabled}
        id={id}
      >
        <Icon>📅</Icon>
        {formatDate(value)}
      </DatePickerButton>
      {isOpen && (
        <DatePicker
          id={`${id}-input`}
          name={`${id}-input`}
          defaultValue={value ? value.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            onChange(new Date(e.target.value));
            setIsOpen(false);
          }}
          aria-describedby={`${id}-hint`}
          aria-labelledby={`${id}-label`}
        />
      )}
    </div>
  );
}

export default USWDSDatePicker;
