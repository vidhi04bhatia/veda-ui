import React, { ReactElement, useState, useMemo } from 'react';
import { NavItem } from './types';
import LogoContainer from './logo-container';
import { createDynamicNavMenuList } from './nav/create-dynamic-nav-menu-list';
import { LinkProperties } from '$types/veda';
import { USWDSHeader, USWDSHeaderTitle } from '$components/common/uswds/header';
import { USWDSNavMenuButton } from '$components/common/uswds/header/nav-menu-button';
import { USWDSExtendedNav } from '$components/common/uswds/header/extended-nav';
import './styles.scss';

const appTitle = process.env.APP_TITLE;
const appVersion = process.env.APP_VERSION;

interface PageHeaderProps {
  mainNavItems: NavItem[];
  subNavItems: NavItem[];
  logo?: ReactElement;
  linkProperties: LinkProperties;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  mainNavItems,
  subNavItems,
  logo: Logo,
  linkProperties
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean[]>(
    mainNavItems.map(() => false)
  );

  const toggleExpansion = (): void => {
    setExpanded((prvExpanded) => {
      return !prvExpanded;
    });
  };

  const primaryItems = useMemo(
    () =>
      createDynamicNavMenuList(mainNavItems, linkProperties, isOpen, setIsOpen),
    [mainNavItems, isOpen]
  );

  const secondaryItems = useMemo(
    () => createDynamicNavMenuList(subNavItems, linkProperties),
    [subNavItems]
  );

  return (
    <>
      <USWDSHeader extended={true} showMobileOverlay={expanded}>
        <div className='usa-navbar'>
          <USWDSHeaderTitle>
            <LogoContainer
              linkProperties={linkProperties}
              Logo={Logo}
              title='Earthdata VEDA Dashboard'
              subTitle={appTitle}
              version={appVersion}
            />
          </USWDSHeaderTitle>
          <USWDSNavMenuButton onClick={toggleExpansion} label='Menu' />
        </div>
        <USWDSExtendedNav
          primaryItems={primaryItems}
          secondaryItems={secondaryItems}
          mobileExpanded={expanded}
          onToggleMobileNav={toggleExpansion}
        />
      </USWDSHeader>
    </>
  );
};

export default PageHeader;
