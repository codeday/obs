import React from 'react';
import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from 'react-confetti'
import Box from '@codeday/topo/Atom/Box';
import { useTheme } from '@codeday/topo/utils';

export default function ConfettiBg() {
    const { width, height } = useWindowSize();
    const { colors } = useTheme();

    return (
      <Box position="absolute" zIndex={-1} left={0} right={0} top={0} bottom={0}>
        <Confetti
          width={width}
          height={height}
          colors={[
            colors.cyan[500],
            colors.green[500],
            colors.purple[500],
            colors.yellow[500],
            colors.red[500],
          ]}
        />
      </Box>
    );
}
