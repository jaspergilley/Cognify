# M001: Cognify MVP

**Vision:** Frame-accurate adaptive cognitive speed training implementing the ACTIVE study protocol

## Success Criteria

1. Canvas renders sharply at native DPI with accurate frame timing
2. All 12 geometric shapes render as visually distinct stimuli with frame-accurate display duration
3. 3-Up/1-Down staircase converges to 79.4% correct threshold
4. Complete trial sequence from fixation through response with proper timing
5. Full Exercise 1 training session with 2 blocks of 30 trials
6. Exercise 2 with divided attention and peripheral targets
7. All training data persists across browser sessions via localStorage
8. Audio feedback on correct/incorrect/complete events

## Slices

- [x] **S01: Canvas Rendering Engine** `risk:medium` `depends:[]`
  > After this: Rock-solid canvas surface renders at native resolution with accurate frame timing
- [x] **S02: Stimulus System** `risk:medium` `depends:[S01]`
  > After this: All visual elements render correctly — shapes, masks, peripheral targets with frame-accurate timing
- [x] **S03: Staircase Algorithm** `risk:medium` `depends:[]`
  > After this: Pure-function staircase correctly adapts difficulty and produces stable threshold estimates
- [x] **S04: Trial Engine** `risk:medium` `depends:[S01,S02,S03]`
  > After this: Single trial runs from fixation through response with correct timing and data capture
- [x] **S05: Session Manager And Exercise 1** `risk:medium` `depends:[S04]`
  > After this: Users can run complete Exercise 1 training sessions with 2 blocks of 30 trials
- [x] **S06: Exercise 2 Divided Attention** `risk:medium` `depends:[S05]`
  > After this: Users who completed 5 Exercise 1 sessions can run Exercise 2 with peripheral targets
- [x] **S07: Data Persistence** `risk:medium` `depends:[S05]`
  > After this: All training data persists across browser sessions with session continuity
- [x] **S08: Audio Feedback** `risk:low` `depends:[S04]`
  > After this: Users receive audio cues during training — tones for correct/incorrect, chime for session complete
