import React from 'react';
import GoogleForm from '../google-form';
import { useFeedbackModal } from '../layout-root';
import { ActionNavItem } from './types';

interface NavItemCTAActionProps {
  item: ActionNavItem;
}

export const NavItemCTAAction: React.FC<NavItemCTAActionProps> = ({
  item
}): JSX.Element => {
  const { isRevealed, show, hide } = useFeedbackModal();
  return (
    <React.Fragment key={item.title}>
      {item.actionId === 'open-google-form' && (
        <>
          <a className='usa-nav__link'>
            <span onClick={show}>{item.title}</span>
          </a>
          <GoogleForm
            src={process.env.GOOGLE_FORM || ''}
            isRevealed={isRevealed}
            hide={hide}
          />
        </>
      )}
      {/* @TODO: Other possible cases would go here to perform some type of action */}
    </React.Fragment>
  );
};
