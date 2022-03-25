import styled from 'styled-components';
import { useCallback, useState } from 'react';
import {
  Drawer, Fab, FormControl, FormLabel, InputLabel, Modal, Slider, TextField, Typography,
} from '@mui/material';
import { FaCog } from 'react-icons/fa';
import { Box } from '@mui/system';
import say from '../lib/say';

const StyledFab = styled(Fab)`
  position: fixed !important;
  bottom: 20px;
  right: 20px;
  z-index: 100;
`;

function DebugTools({ config, setConfig }) {
  const [isOpen, setOpen] = useState(false);

  const onChangeTextToRead = useCallback((event) => {
    setConfig({ textToRead: event.target.value });
  }, []);

  const onChangeReadingSpeed = useCallback((event) => {
    const readingSpeed = event.target.value;
    setConfig({ readingSpeed });
    speechSynthesis.cancel();
    say('This is how fast I speak', readingSpeed);
  }, []);

  return (
    <>
      <StyledFab color="primary" onClick={() => setOpen(!isOpen)}>
        <FaCog />
      </StyledFab>
      <Drawer anchor="right" open={isOpen} onClose={() => setOpen(false)}>
        <Box p={4} minWidth={500}>
          <Typography variant="h6" mb={2}>Setup</Typography>
          <TextField
            label="Text to read"
            multiline
            maxRows={5}
            sx={{ width: 1 }}
            value={config.textToRead}
            onChange={onChangeTextToRead}
          />
          <Box my={4}>
            <FormLabel>Reading speed</FormLabel>
            <Slider value={config.readingSpeed} min={0} max={2} step={0.05} onChange={onChangeReadingSpeed} />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

export default DebugTools;
