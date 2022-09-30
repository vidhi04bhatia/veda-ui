import React from 'react';
import styled from 'styled-components';

import { media, multiply, themeVal } from '@devseed-ui/theme-provider';
import {
  Toolbar,
  ToolbarIconButton,
  ToolbarLabel,
  VerticalDivider
} from '@devseed-ui/toolbar';
import {
  Form,
  FormCheckable,
  FormGroupStructure,
  FormInput
} from '@devseed-ui/form';
import {
  CollecticonArea,
  CollecticonCircleInformation,
  CollecticonEllipsisVertical,
  CollecticonTrashBin,
  CollecticonUpload2
} from '@devseed-ui/collecticons';

import { LayoutProps } from '$components/common/layout-root';
import PageHeroAnalysis from '$components/analysis/page-hero-analysis';
import { resourceNotFound } from '$components/uhoh';

import { useThematicArea } from '$utils/thematics';

import { PageMainContent } from '$styles/page';
import Constrainer from '$styles/constrainer';
import { variableGlsp } from '$styles/variable-utils';
import { VarHeading } from '$styles/variable-components';
import { Dropdown, DropMenu, DropMenuItem, DropTitle } from '@devseed-ui/dropdown';

export const Block = styled.section`
  padding-top: ${variableGlsp(2)};
  padding-bottom: ${variableGlsp(2)};
  background: ${themeVal('color.surface')};
  box-shadow: 0 0 0 1px ${themeVal('color.base-100a')};
`;

const BlockInner = styled(Constrainer)`
  display: flex;
  flex-flow: column nowrap;
`;

export const BlockHeader = styled.header`
  display: flex;
  flex-flow: row nowrap;
  gap: ${variableGlsp()};
`;

export const BlockHeadline = styled.div`
  /* styled-component */
`;

export const BlockTitle = styled(VarHeading).attrs({
  as: 'h2',
  size: 'small'
})`
  /* styled-component */
`;

export const BlockActions = styled.div`
  margin-left: auto;
`;

export const BlockBody = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: ${variableGlsp()};
`;

export const MapContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${themeVal('color.base-50')};
  border-radius: ${multiply(themeVal('shape.rounded'), 2)};
  min-height: 24rem;
`;

const FormBlock = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: ${variableGlsp(0.5)};

  > * {
    width: 50%;
  }
`;

const CheckableGroup = styled.div`
  display: grid;
  gap: ${variableGlsp(0.5)};
  grid-template-columns: repeat(2, 1fr);
  background: ${themeVal('color.surface')};

  ${media.mediumUp`
    grid-template-columns: repeat(3, 1fr);
  `}

  ${media.xlargeUp`
    grid-template-columns: repeat(4, 1fr);
  `}
`;

const FormCheckableCustom = styled(FormCheckable)`
  padding: ${variableGlsp(0.5)};
  background: ${themeVal('color.surface')};
  box-shadow: 0 0 0 1px ${themeVal('color.base-100a')};
  border-radius: ${themeVal('shape.rounded')};
`;

export const Note = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: ${variableGlsp(0.5)};
  justify-content: center;
  align-items: center;
  text-align: center;
  background: ${themeVal('color.base-50')};
  border-radius: ${multiply(themeVal('shape.rounded'), 2)};
  min-height: 12rem;
  padding: ${variableGlsp()};

  [class*='Collecticon'] {
    opacity: 0.32;
  }
`;

export default function Analysis() {
  const thematic = useThematicArea();
  if (!thematic) throw resourceNotFound();

  return (
    <PageMainContent>
      <LayoutProps
        title='Analysis'
        description='Visualize insights from a selected area over a period of time.'
        thumbnail={thematic.data.media?.src}
      />
      <PageHeroAnalysis
        title='Start analysis'
        description='Visualize insights from a selected area over a period of time.'
      />
      <Block>
        <BlockInner>
          <BlockHeader>
            <BlockHeadline>
              <BlockTitle>Area</BlockTitle>
            </BlockHeadline>
            <BlockActions>
              <Toolbar size='small'>
                <ToolbarLabel>Actions</ToolbarLabel>
                <ToolbarIconButton variation='base-text' disabled>
                  <CollecticonTrashBin title='Delete shape' meaningful />
                </ToolbarIconButton>
                <VerticalDivider variation='dark' />
                <ToolbarIconButton variation='base-text'>
                  <CollecticonArea title='Draw shape' meaningful />
                </ToolbarIconButton>
                <ToolbarIconButton variation='base-text'>
                  <CollecticonUpload2 title='Upload geoJSON' meaningful />
                </ToolbarIconButton>
                <Dropdown
                  alignment='right'
                  triggerElement={(props) => (
                    <ToolbarIconButton variation='base-text' {...props}>
                      <CollecticonEllipsisVertical
                        title='More options'
                        meaningful
                      />
                    </ToolbarIconButton>
                  )}
                >
                  <DropTitle>Select a country</DropTitle>
                  <DropMenu>
                    <li>
                      <DropMenuItem href='#'>Country name A</DropMenuItem>
                    </li>
                    <li>
                      <DropMenuItem href='#'>Country name B</DropMenuItem>
                    </li>
                    <li>
                      <DropMenuItem href='#'>Country name C</DropMenuItem>
                    </li>
                    <li>
                      <DropMenuItem href='#'>Country name D</DropMenuItem>
                    </li>
                  </DropMenu>
                </Dropdown>
              </Toolbar>
            </BlockActions>
          </BlockHeader>
          <BlockBody>
            <MapContainer>
              <p>Map goes here.</p>
            </MapContainer>
          </BlockBody>
        </BlockInner>
      </Block>

      <Block>
        <BlockInner>
          <BlockHeader>
            <BlockHeadline>
              <BlockTitle>Date</BlockTitle>
            </BlockHeadline>
            <BlockActions>
              <Toolbar size='small'>
                <ToolbarLabel>Actions</ToolbarLabel>
                <Dropdown
                  alignment='right'
                  triggerElement={(props) => (
                    <ToolbarIconButton variation='base-text' {...props}>
                      <CollecticonEllipsisVertical
                        title='More options'
                        meaningful
                      />
                    </ToolbarIconButton>
                  )}
                >
                  <DropTitle>Select a date preset</DropTitle>
                  <DropMenu>
                    <li>
                      <DropMenuItem href='#'>Preset A</DropMenuItem>
                    </li>
                    <li>
                      <DropMenuItem href='#'>Preset B</DropMenuItem>
                    </li>
                    <li>
                      <DropMenuItem href='#'>Preset C</DropMenuItem>
                    </li>
                    <li>
                      <DropMenuItem href='#'>Preset D</DropMenuItem>
                    </li>
                  </DropMenu>
                </Dropdown>
              </Toolbar>
            </BlockActions>
          </BlockHeader>
          <BlockBody>
            <Form>
              <FormBlock>
                <FormGroupStructure label='Start' id='start-date' required>
                  <FormInput
                    type='date'
                    size='large'
                    id='start-date'
                    name='start-date'
                  />
                </FormGroupStructure>

                <FormGroupStructure label='End' id='end-date' required>
                  <FormInput
                    type='date'
                    size='large'
                    id='end-date'
                    name='end-date'
                  />
                </FormGroupStructure>
              </FormBlock>
            </Form>
          </BlockBody>
        </BlockInner>
      </Block>

      <Block>
        <BlockInner>
          <BlockHeader>
            <BlockHeadline>
              <BlockTitle>Datasets</BlockTitle>
            </BlockHeadline>
          </BlockHeader>
          <BlockBody>
            <Note>
              <CollecticonCircleInformation size='large' />
              <p>To select datasets, please define an area and a date first.</p>
            </Note>
            <Form>
              <CheckableGroup>
                <FormCheckableCustom
                  id='dataset-a'
                  name='dataset-a'
                  textPlacement='right'
                  type='checkbox'
                >
                  Dataset name
                </FormCheckableCustom>

                <FormCheckableCustom
                  id='dataset-b'
                  name='dataset-b'
                  textPlacement='right'
                  type='checkbox'
                >
                  Dataset name
                </FormCheckableCustom>

                <FormCheckableCustom
                  id='dataset-c'
                  name='dataset-c'
                  textPlacement='right'
                  type='checkbox'
                >
                  Dataset name
                </FormCheckableCustom>

                <FormCheckableCustom
                  id='dataset-d'
                  name='dataset-d'
                  textPlacement='right'
                  type='checkbox'
                >
                  Dataset name
                </FormCheckableCustom>

                <FormCheckableCustom
                  id='dataset-e'
                  name='dataset-e'
                  textPlacement='right'
                  type='checkbox'
                >
                  Dataset name
                </FormCheckableCustom>

                <FormCheckableCustom
                  id='dataset-f'
                  name='dataset-f'
                  textPlacement='right'
                  type='checkbox'
                >
                  Dataset name
                </FormCheckableCustom>
              </CheckableGroup>
            </Form>
          </BlockBody>
        </BlockInner>
      </Block>
    </PageMainContent>
  );
}
