import React, { useState } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3-scale-chromatic';
import { Icon } from "@trussworks/react-uswds";

import './colormap-options.scss';

const Container = styled.div`
  background: white;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
  width: 360px;
`;

const Header = styled.div`
  font-size: 1rem;
  font-weight: bold;
  color: #000;
  padding: 16px;
`;

const ColormapWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const ColormapItem = styled.div<{ selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 12px 16px;
  border-bottom: 1px solid #E0E0EB;
  border-radius: 4px;
  gap: 12px;
  &:hover {
    background-color: #f4f4f4;
  }
  ${({ selected }) =>
    selected &&
    `
    outline: 2px solid #007BFF;
    outline-offset: -2px;
    background-color: #E8F0FD;
  `}
`;

const ColormapLabel = styled.div`
  font-size: 0.875rem;
  color: #858585;
  font-weight: 500;
  text-align: left;
  flex: 1;
`;

interface ColormapPreviewProps {
  colormap: string[];
}

const ColormapPreview = styled.div<ColormapPreviewProps>`
  width: 260px;
  height: 12px;
  background: ${({ colormap }) =>
    `linear-gradient(to right, ${colormap.join(', ')})`};
  border-radius: 4px;
  border: 1px solid #E0E0EB;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  padding: 16px;
  background-color: #FAFAFA;
  border-top: 1px solid #E0E0EB;
`;

const ToggleLabel = styled.label`
  margin-right: 8px;
  color: #000;
`;

const ToggleInput = styled.input.attrs({ type: 'checkbox' })`
  display: none;
`;

const Divider = styled.div`
  width: calc(100% - 32px);
  height: 1px;
  background-color: #E0E0EB;
  margin: 0 auto;
`;

const Colormaps = [
  { name: 'Viridis', scale: d3.interpolateViridis },
  { name: 'Plasma', scale: d3.interpolatePlasma },
  { name: 'Inferno', scale: d3.interpolateInferno },
  { name: 'Magma', scale: d3.interpolateMagma },
  { name: 'Cividis', scale: d3.interpolateCividis },
  { name: 'Purples', scale: d3.interpolatePurples },
  { name: 'Blues', scale: d3.interpolateBlues },
  { name: 'Reds', scale: d3.interpolateReds },
  { name: 'Greens', scale: d3.interpolateGreens },
  { name: 'Oranges', scale: d3.interpolateOranges },
  { name: 'YlGnBu', scale: d3.interpolateYlGnBu },
  { name: 'YlGn', scale: d3.interpolateYlGn },
  { name: 'GnBu', scale: d3.interpolateGnBu },
];

export function ColormapOptions({ onChangeColorMap }) {
    const [isReversed, setIsReversed] = useState(false);
    const [selectedColorMap, setSelectedColorMap] = useState('viridis');

    const handleReverseToggle = () => {
      const newIsReversed = !isReversed;
      setIsReversed(newIsReversed);
      onChangeColorMap(newIsReversed ? `${selectedColorMap}_r` : selectedColorMap);
    };

    const handleColorMapSelect = (colorMap) => {
      setSelectedColorMap(colorMap);
      onChangeColorMap(isReversed ? `${colorMap}_r` : colorMap);
    };

    return (
      <Container>
        <Header>Colormap options</Header>

        <ToggleContainer onClick={handleReverseToggle}>
          <ToggleLabel>Reverse</ToggleLabel>
          {isReversed ? (
              <Icon.ToggleOn
                  className='text-primary'
                  size={4}
                  fill=''
              />
          ) : (
              <Icon.ToggleOff
                  className='text-primary-dark'
                  size={4}
              />
          )}
          <ToggleInput checked={isReversed} />
        </ToggleContainer>

        <Divider />
        <ColormapWrapper>
          {Colormaps.map((colormap) => {
            const colors = [0, 0.5, 1].map(t => colormap.scale(t));
            const previewColors = isReversed ? colors.reverse() : colors;

            return (
                <ColormapItem
                key={colormap.name}
                selected={selectedColorMap === colormap.name.toLowerCase()}
                onClick={() => handleColorMapSelect(colormap.name.toLowerCase())}
                >
                <ColormapPreview colormap={previewColors} />
                <ColormapLabel>{colormap.name}</ColormapLabel>
                </ColormapItem>
            );
          })}
        </ColormapWrapper>
      </Container>
    );
}
