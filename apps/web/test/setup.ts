import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { setDoubleTapMs } from '../src/screens/Workout.tsx';

// Tests tap faster than a person; the double-tap guard has its own test.
setDoubleTapMs(0);

afterEach(cleanup);
