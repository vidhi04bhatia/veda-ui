import React, { useMemo } from 'react';
import { Icon } from '@trussworks/react-uswds';
import { DropdownNavLink, FooterSettings, NavLinkItem } from 'veda';
import { ActionNavItem, NavItemType } from '../page-header/types';
import { NavItemCTA } from '../page-header/nav/nav-item-cta';
import ReturnToTopButton from './return-to-top-button';
import {
  USWDSFooter,
  USWDSFooterNav,
  USWDSAddress
} from '$components/common/uswds';


interface PageFooterProps {
  //use of NavItem is causing issues with TS and throwing erros in the .
  mainNavItems: (NavLinkItem | DropdownNavLink | ActionNavItem)[];
  subNavItems: (NavLinkItem | DropdownNavLink | ActionNavItem)[];
  settings: FooterSettings;
  hideFooter?: boolean;
  logoSvg?: SVGElement | JSX.Element;
}
//TODO: clean up PageFooterProps, Unexpected any. Specify a different interface.

export default function PageFooter({
  settings,
  mainNavItems,
  subNavItems,
  hideFooter,
  logoSvg
}: PageFooterProps) {
  const { returnToTop, secondarySection } = settings;

  const createNavElement = (navItems, linkClasses) => {
    //removing 'dropdown' items from array
    const cleanedNavItems = navItems.filter((a) => {
      if (a.type !== 'dropdown') {
        return a;
      }
    });

    return cleanedNavItems.map((item) => {
      switch (item.type) {
        case NavItemType.ACTION:
          return <NavItemCTA item={item} customClasses={linkClasses} />;

        case NavItemType.EXTERNAL_LINK:
          return (
            <a className={linkClasses} href={item.to} key={item.id}>
              {item.title}
            </a>
          );
        case NavItemType.INTERNAL_LINK:
          return (
            <a className={linkClasses} href={item.to} key={item.id}>
              {item.title}
            </a>
          );

        default:
          return <></>;
      }
    });
  };

  const primaryItems = useMemo(
    () => createNavElement(mainNavItems, 'usa-footer__primary-link'),
    [mainNavItems]
  );
  const secondaryItems = useMemo(
    () =>
      createNavElement(subNavItems, 'usa-link text-base-dark text-underline'),
    [mainNavItems]
  );
  return (
    <USWDSFooter
      size='slim'
      returnToTop={returnToTop && <ReturnToTopButton />}
      className={hideFooter && 'display-none'}
      primary={
        <div
          id='footer_primary_container'
          className=' grid-row  usa-footer__primary-container'
        >
          <div className='mobile-lg:grid-col-8'>
            <USWDSFooterNav
              aria-label='Footer navigation'
              size='slim'
              links={primaryItems}
            />
          </div>
          <div className='tablet:grid-col-4'>
            <USWDSAddress
              size='slim'
              className='flex-justify-end'
              items={secondaryItems}
            />
          </div>
        </div>
      }
      secondary={
        <div id='footer_secondary_container' className='grid-row'>
          <div id='logo-container'>
            <a id='logo-container-link' href='#'>
              {logoSvg as JSX.Element}
              <span className='footer-text'>
                {secondarySection.division} • {secondarySection.version}
              </span>
            </a>
          </div>
          <div className='grid-col-4 footer-text grid-gap-6 flex-justify-end'>
            <span>{secondarySection.title}: </span>
            <a
              key={secondarySection.type}
              href={`mailto:${secondarySection.to}`}
              className='text-primary-light'
            >
              <Icon.Mail
                className='margin-right-1 width-205 height-auto position-relative'
                id='mail_icon'
              />
              {secondarySection.name}
            </a>
          </div>
        </div>
      }
    />
  );
}
