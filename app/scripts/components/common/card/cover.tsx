import React from 'react';
import format from 'date-fns/format';
import styled, { css } from 'styled-components';
import { themeVal } from '@devseed-ui/theme-provider';
import {
  CardBody,
  CardHeader,
  CardHeadline,
  CardTitle,
  CardOverline,
  CardLabel,
  CardFooter,
  CardBlank,
  CardFigure
} from './styles';
import { CardItemProps, CardComponentProps, ExternalLinkFlag } from '.';
import { useVedaUI } from '$context/veda-ui-provider';
import { variableGlsp } from '$styles/variable-utils';

export const CoverCardItem = styled(CardBlank)<CardItemProps>`
  padding-top: ${variableGlsp(2)};
  background: ${themeVal('color.base-400')};
  color: ${themeVal('color.surface')};
  justify-content: flex-end;

  ${CardFigure} {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: ${themeVal('color.base-400')};
  }

  ${CardOverline} {
    color: ${themeVal('color.surface-400a')};
  }

  ${({ isStateFocus }) =>
    isStateFocus &&
    css`
      box-shadow: ${themeVal('boxShadow.elevationC')};
      transform: translate(0, 0.125rem);
    `}
  ${({ isStateOver }) =>
    isStateOver &&
    css`
      box-shadow: ${themeVal('boxShadow.elevationC')};
      transform: translate(0, 0.125rem);
    `}
  ${({ isStateActive }) =>
    isStateActive &&
    css`
      box-shadow: ${themeVal('boxShadow.elevationB')};
      transform: translate(0, 0.125rem);
    `}
`;

export default function CoverCard(props: CardComponentProps) {
  const {
    title,
    description,
    date,
    overline,
    imgSrc,
    imgAlt,
    parentTo,
    tagLabels,
    footerContent,
    hideExternalLinkBadge
  } = props;

  let isExternalLink;

  if ('isExternalLink' in props) {
    ({ isExternalLink } = props);
  }

  const { Link } = useVedaUI();

  const CardContent = (
    <>
      <CardHeader>
        <CardHeadline>
          <CardTitle>{title}</CardTitle>
          <CardOverline as='div'>
            {hideExternalLinkBadge !== true && isExternalLink && (
              <ExternalLinkFlag />
            )}
            {!isExternalLink &&
              tagLabels &&
              parentTo &&
              tagLabels.map((label) => (
                <CardLabel as={Link} to={parentTo} key={label}>
                  {label}
                </CardLabel>
              ))}
            {date ? (
              <>
                published on{' '}
                <time dateTime={format(date, 'yyyy-MM-dd')}>
                  {format(date, 'MMM d, yyyy')}
                </time>
              </>
            ) : (
              overline
            )}
          </CardOverline>
        </CardHeadline>
      </CardHeader>
      {description && (
        <CardBody>
          <p>{description}</p>
        </CardBody>
      )}
      {footerContent && <CardFooter>{footerContent}</CardFooter>}
      <CardFigure src={imgSrc} isCoverOrFeatured={true}>
        <img src={imgSrc} alt={imgAlt} loading='lazy' />
      </CardFigure>
    </>
  );

  return CardContent;
}
