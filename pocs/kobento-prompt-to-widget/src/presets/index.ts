export interface WidgetPreset {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  viewport: { width: number; height: number };
  json: Record<string, unknown>;
}

export const WIDGET_PRESETS: WidgetPreset[] = [
  {
    id: 'pomodoro',
    title: 'Pomodoro Focus Timer',
    description: 'Interactive countdown ring with Start/Pause and Reset host actions.',
    keywords: ['pomodoro', 'timer', 'focus', 'countdown', 'clock', 'workout', 'interval'],
    viewport: { width: 380, height: 460 },
    json: {
      header: { apiLevel: 7, width: 380, height: 460, profiles: 513 },
      resources: {
        variables: {
          progress: { value: 0.72, export: true },
          sessions: { value: 3, export: true },
        },
        colors: {
          accent: '#FF6366F1',
          bg: '#FF0F172A',
          surface: '#FF1E293B',
        },
      },
      root: [
        { variable: { name: 'phase', vtype: 'string', value: 'DEEP FOCUS', export: true } },
        { variable: { name: 'timeLabel', vtype: 'string', value: '18:00', export: true } },
        { variable: { name: 'ctaLabel', vtype: 'string', value: 'Start Timer', export: true } },
        {
          column: {
            modifiers: ['fillMaxSize', { background: '@bg' }, { padding: 24 }],
            horizontalAlignment: 'center',
            verticalArrangement: 'spaceBetween',
            children: [
              {
                row: {
                  modifiers: ['fillMaxWidth'],
                  horizontalArrangement: 'spaceBetween',
                  verticalAlignment: 'center',
                  children: [
                    { text: { text: '@phase', color: '@accent', fontSize: 13, fontWeight: 700 } },
                    { text: { text: 'SESSION #3', color: '#FF94A3B8', fontSize: 12, fontWeight: 600 } },
                  ],
                },
              },
              {
                box: {
                  modifiers: [{ size: [230, 230] }],
                  contentAlignment: 'center',
                  children: [
                    {
                      canvas: {
                        modifiers: ['fillMaxSize'],
                        commands: [
                          {
                            paint: {
                              color: '#FF1E293B',
                              style: 'stroke',
                              strokeWidth: 16,
                              strokeCap: 'round',
                            },
                          },
                          {
                            drawArc: {
                              left: 18,
                              top: 18,
                              right: 212,
                              bottom: 212,
                              startAngle: 0,
                              sweepAngle: 360,
                            },
                          },
                          {
                            paint: {
                              color: '@accent',
                              style: 'stroke',
                              strokeWidth: 16,
                              strokeCap: 'round',
                            },
                          },
                          {
                            drawArc: {
                              left: 18,
                              top: 18,
                              right: 212,
                              bottom: 212,
                              startAngle: -90,
                              sweepAngle: 'progress * 360',
                            },
                          },
                        ],
                      },
                    },
                    {
                      column: {
                        horizontalAlignment: 'center',
                        children: [
                          { text: { text: '@timeLabel', color: '#FFF8FAFC', fontSize: 44, fontWeight: 700 } },
                          { text: { text: 'remaining', color: '#FF94A3B8', fontSize: 13 } },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                row: {
                  modifiers: ['fillMaxWidth'],
                  horizontalArrangement: 'spaceBetween',
                  children: [
                    {
                      box: {
                        modifiers: [
                          { width: 195 },
                          { height: 48 },
                          { clip: { type: 'roundedRect', radius: 12 } },
                          { background: '@accent' },
                          { onClick: { type: 'hostNamedAction', name: 'timer_toggle', value: 'toggle' } },
                        ],
                        contentAlignment: 'center',
                        children: [
                          { text: { text: '@ctaLabel', color: '#FFFFFFFF', fontSize: 15, fontWeight: 700 } },
                        ],
                      },
                    },
                    {
                      box: {
                        modifiers: [
                          { width: 115 },
                          { height: 48 },
                          { clip: { type: 'roundedRect', radius: 12 } },
                          { background: '@surface' },
                          { onClick: { type: 'hostNamedAction', name: 'timer_reset', value: 'reset' } },
                        ],
                        contentAlignment: 'center',
                        children: [
                          { text: { text: 'Reset', color: '#FFE2E8F0', fontSize: 15, fontWeight: 600 } },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'boarding-pass',
    title: 'Flight Boarding Pass',
    description: 'Live airline pass with gate/seat bindings and Check-In action.',
    keywords: ['flight', 'boarding', 'pass', 'airline', 'travel', 'ticket', 'airport'],
    viewport: { width: 380, height: 460 },
    json: {
      header: { apiLevel: 7, width: 380, height: 460, profiles: 513 },
      resources: {
        variables: {
          boardingPct: { value: 0.65, export: true },
        },
        colors: {
          accent: '#FF0EA5E9',
          bg: '#FF0B1120',
          card: '#FF172033',
        },
      },
      root: [
        { variable: { name: 'flight', vtype: 'string', value: 'KB 402', export: true } },
        { variable: { name: 'origin', vtype: 'string', value: 'SFO', export: true } },
        { variable: { name: 'destination', vtype: 'string', value: 'NRT', export: true } },
        { variable: { name: 'gate', vtype: 'string', value: 'G14', export: true } },
        { variable: { name: 'seat', vtype: 'string', value: '12A', export: true } },
        { variable: { name: 'status', vtype: 'string', value: 'BOARDING GROUP 2', export: true } },
        {
          column: {
            modifiers: ['fillMaxSize', { background: '@bg' }, { padding: 20 }],
            verticalArrangement: 'spaceBetween',
            children: [
              {
                row: {
                  modifiers: ['fillMaxWidth'],
                  horizontalArrangement: 'spaceBetween',
                  verticalAlignment: 'center',
                  children: [
                    { text: { text: '@flight', color: '@accent', fontSize: 16, fontWeight: 700 } },
                    { text: { text: '@status', color: '#FF38BDF8', fontSize: 12, fontWeight: 700 } },
                  ],
                },
              },
              {
                column: {
                  modifiers: [
                    'fillMaxWidth',
                    { clip: { type: 'roundedRect', radius: 16 } },
                    { background: '@card' },
                    { padding: 20 },
                  ],
                  children: [
                    {
                      row: {
                        modifiers: ['fillMaxWidth'],
                        horizontalArrangement: 'spaceBetween',
                        verticalAlignment: 'center',
                        children: [
                          { text: { text: '@origin', color: '#FFF8FAFC', fontSize: 40, fontWeight: 700 } },
                          { text: { text: '✈', color: '@accent', fontSize: 24 } },
                          { text: { text: '@destination', color: '#FFF8FAFC', fontSize: 40, fontWeight: 700 } },
                        ],
                      },
                    },
                    { spacer: { modifiers: [{ height: 18 }] } },
                    {
                      canvas: {
                        modifiers: ['fillMaxWidth', { height: 10 }],
                        commands: [
                          { paint: { color: '#FF334155', style: 'fill' } },
                          { drawRoundRect: { left: 0, top: 2, right: 300, bottom: 8, rx: 3, ry: 3 } },
                          { paint: { color: '@accent', style: 'fill' } },
                          { drawRoundRect: { left: 0, top: 2, right: 'boardingPct * 300', bottom: 8, rx: 3, ry: 3 } },
                        ],
                      },
                    },
                    { spacer: { modifiers: [{ height: 18 }] } },
                    {
                      row: {
                        modifiers: ['fillMaxWidth'],
                        horizontalArrangement: 'spaceBetween',
                        children: [
                          {
                            column: {
                              children: [
                                { text: { text: 'GATE', color: '#FF94A3B8', fontSize: 11, fontWeight: 600 } },
                                { text: { text: '@gate', color: '#FFF8FAFC', fontSize: 24, fontWeight: 700 } },
                              ],
                            },
                          },
                          {
                            column: {
                              children: [
                                { text: { text: 'SEAT', color: '#FF94A3B8', fontSize: 11, fontWeight: 600 } },
                                { text: { text: '@seat', color: '#FFF8FAFC', fontSize: 24, fontWeight: 700 } },
                              ],
                            },
                          },
                          {
                            column: {
                              children: [
                                { text: { text: 'DEPART', color: '#FF94A3B8', fontSize: 11, fontWeight: 600 } },
                                { text: { text: '14:35', color: '#FFF8FAFC', fontSize: 24, fontWeight: 700 } },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                row: {
                  modifiers: ['fillMaxWidth'],
                  horizontalArrangement: 'spaceBetween',
                  children: [
                    {
                      box: {
                        modifiers: [
                          { width: 200 },
                          { height: 48 },
                          { clip: { type: 'roundedRect', radius: 12 } },
                          { background: '@accent' },
                          { onClick: { type: 'hostNamedAction', name: 'boarding_checkin', value: 'checked_in' } },
                        ],
                        contentAlignment: 'center',
                        children: [
                          { text: { text: 'Mark Boarded', color: '#FFFFFFFF', fontSize: 15, fontWeight: 700 } },
                        ],
                      },
                    },
                    {
                      box: {
                        modifiers: [
                          { width: 120 },
                          { height: 48 },
                          { clip: { type: 'roundedRect', radius: 12 } },
                          { background: '@card' },
                          { onClick: { type: 'hostNamedAction', name: 'boarding_gate_change', value: 'next_gate' } },
                        ],
                        contentAlignment: 'center',
                        children: [
                          { text: { text: 'New Gate', color: '#FFE2E8F0', fontSize: 14, fontWeight: 600 } },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'telemetry-gauge',
    title: 'System Telemetry Gauge',
    description: 'Live CPU & Memory rings driven by host float variables.',
    keywords: ['cpu', 'memory', 'telemetry', 'gauge', 'metrics', 'dashboard', 'server', 'monitor'],
    viewport: { width: 560, height: 340 },
    json: {
      header: { apiLevel: 7, width: 560, height: 340, profiles: 513 },
      resources: {
        variables: {
          cpuLoad: { value: 0.42, export: true },
          memLoad: { value: 0.68, export: true },
        },
        colors: {
          cpuColor: '#FF22C55E',
          memColor: '#FFF59E0B',
          bg: '#FF090D16',
          card: '#FF131B2E',
        },
      },
      root: [
        { variable: { name: 'cluster', vtype: 'string', value: 'prod-us-west-2', export: true } },
        { variable: { name: 'cpuText', vtype: 'string', value: '42%', export: true } },
        { variable: { name: 'memText', vtype: 'string', value: '68%', export: true } },
        {
          column: {
            modifiers: ['fillMaxSize', { background: '@bg' }, { padding: 20 }],
            verticalArrangement: 'spaceBetween',
            children: [
              {
                row: {
                  modifiers: ['fillMaxWidth'],
                  horizontalArrangement: 'spaceBetween',
                  verticalAlignment: 'center',
                  children: [
                    { text: { text: '@cluster', color: '#FFF8FAFC', fontSize: 18, fontWeight: 700 } },
                    {
                      box: {
                        modifiers: [
                          { width: 136 },
                          { height: 34 },
                          { clip: { type: 'roundedRect', radius: 10 } },
                          { background: '@card' },
                          { onClick: { type: 'hostNamedAction', name: 'telemetry_spike', value: 'spike' } },
                        ],
                        contentAlignment: 'center',
                        children: [
                          { text: { text: 'Simulate Spike', color: '#FF93C5FD', fontSize: 12, fontWeight: 700 } },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                row: {
                  modifiers: ['fillMaxWidth'],
                  horizontalArrangement: 'spaceAround',
                  verticalAlignment: 'center',
                  children: [
                    {
                      box: {
                        modifiers: [{ size: [180, 180] }],
                        contentAlignment: 'center',
                        children: [
                          {
                            canvas: {
                              modifiers: ['fillMaxSize'],
                              commands: [
                                { paint: { color: '#FF1E293B', style: 'stroke', strokeWidth: 16, strokeCap: 'round' } },
                                { drawArc: { left: 16, top: 16, right: 164, bottom: 164, startAngle: 135, sweepAngle: 270 } },
                                { paint: { color: '@cpuColor', style: 'stroke', strokeWidth: 16, strokeCap: 'round' } },
                                { drawArc: { left: 16, top: 16, right: 164, bottom: 164, startAngle: 135, sweepAngle: 'cpuLoad * 270' } },
                              ],
                            },
                          },
                          {
                            column: {
                              horizontalAlignment: 'center',
                              children: [
                                { text: { text: '@cpuText', color: '#FFF8FAFC', fontSize: 30, fontWeight: 700 } },
                                { text: { text: 'CPU', color: '#FF94A3B8', fontSize: 12, fontWeight: 600 } },
                              ],
                            },
                          },
                        ],
                      },
                    },
                    {
                      box: {
                        modifiers: [{ size: [180, 180] }],
                        contentAlignment: 'center',
                        children: [
                          {
                            canvas: {
                              modifiers: ['fillMaxSize'],
                              commands: [
                                { paint: { color: '#FF1E293B', style: 'stroke', strokeWidth: 16, strokeCap: 'round' } },
                                { drawArc: { left: 16, top: 16, right: 164, bottom: 164, startAngle: 135, sweepAngle: 270 } },
                                { paint: { color: '@memColor', style: 'stroke', strokeWidth: 16, strokeCap: 'round' } },
                                { drawArc: { left: 16, top: 16, right: 164, bottom: 164, startAngle: 135, sweepAngle: 'memLoad * 270' } },
                              ],
                            },
                          },
                          {
                            column: {
                              horizontalAlignment: 'center',
                              children: [
                                { text: { text: '@memText', color: '#FFF8FAFC', fontSize: 30, fontWeight: 700 } },
                                { text: { text: 'MEMORY', color: '#FF94A3B8', fontSize: 12, fontWeight: 600 } },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                text: {
                  text: 'Drag cpuLoad / memLoad in Host API panel for 60fps updates',
                  color: '#FF64748B',
                  fontSize: 12,
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'tip-calculator',
    title: 'Tip & Split Calculator',
    description: 'Interactive bill splitter driven by host actions and live labels.',
    keywords: ['tip', 'calculator', 'split', 'bill', 'finance', 'money', 'price'],
    viewport: { width: 380, height: 460 },
    json: {
      header: { apiLevel: 7, width: 380, height: 460, profiles: 513 },
      resources: {
        variables: {
          bill: { value: 84, export: true },
          tipPct: { value: 18, export: true },
          people: { value: 2, export: true },
        },
        colors: {
          accent: '#FF10B981',
          bg: '#FF0C1219',
          card: '#FF151F2B',
        },
      },
      root: [
        { variable: { name: 'perPersonText', vtype: 'string', value: '$49.56', export: true } },
        { variable: { name: 'summaryText', vtype: 'string', value: '$84.00 bill · 18% tip · 2 people', export: true } },
        {
          column: {
            modifiers: ['fillMaxSize', { background: '@bg' }, { padding: 22 }],
            verticalArrangement: 'spaceBetween',
            children: [
              { text: { text: 'TIP & SPLIT', color: '@accent', fontSize: 13, fontWeight: 700 } },
              {
                column: {
                  modifiers: [
                    'fillMaxWidth',
                    { clip: { type: 'roundedRect', radius: 16 } },
                    { background: '@card' },
                    { padding: 22 },
                  ],
                  horizontalAlignment: 'center',
                  children: [
                    { text: { text: 'PER PERSON', color: '#FF94A3B8', fontSize: 12, fontWeight: 600 } },
                    { spacer: { modifiers: [{ height: 6 }] } },
                    { text: { text: '@perPersonText', color: '#FFF8FAFC', fontSize: 44, fontWeight: 700 } },
                    { spacer: { modifiers: [{ height: 10 }] } },
                    { text: { text: '@summaryText', color: '#FF94A3B8', fontSize: 13 } },
                  ],
                },
              },
              {
                column: {
                  modifiers: ['fillMaxWidth'],
                  children: [
                    {
                      row: {
                        modifiers: ['fillMaxWidth'],
                        horizontalArrangement: 'spaceBetween',
                        children: [
                          {
                            box: {
                              modifiers: [
                                { width: 104 },
                                { height: 44 },
                                { clip: { type: 'roundedRect', radius: 10 } },
                                { background: '@card' },
                                { onClick: { type: 'hostNamedAction', name: 'tip_set', value: '15' } },
                              ],
                              contentAlignment: 'center',
                              children: [{ text: { text: '15%', color: '#FFE2E8F0', fontSize: 15, fontWeight: 700 } }],
                            },
                          },
                          {
                            box: {
                              modifiers: [
                                { width: 104 },
                                { height: 44 },
                                { clip: { type: 'roundedRect', radius: 10 } },
                                { background: '@accent' },
                                { onClick: { type: 'hostNamedAction', name: 'tip_set', value: '18' } },
                              ],
                              contentAlignment: 'center',
                              children: [{ text: { text: '18%', color: '#FFFFFFFF', fontSize: 15, fontWeight: 700 } }],
                            },
                          },
                          {
                            box: {
                              modifiers: [
                                { width: 104 },
                                { height: 44 },
                                { clip: { type: 'roundedRect', radius: 10 } },
                                { background: '@card' },
                                { onClick: { type: 'hostNamedAction', name: 'tip_set', value: '22' } },
                              ],
                              contentAlignment: 'center',
                              children: [{ text: { text: '22%', color: '#FFE2E8F0', fontSize: 15, fontWeight: 700 } }],
                            },
                          },
                        ],
                      },
                    },
                    { spacer: { modifiers: [{ height: 12 }] } },
                    {
                      row: {
                        modifiers: ['fillMaxWidth'],
                        horizontalArrangement: 'spaceBetween',
                        children: [
                          {
                            box: {
                              modifiers: [
                                { width: 160 },
                                { height: 44 },
                                { clip: { type: 'roundedRect', radius: 10 } },
                                { background: '@card' },
                                { onClick: { type: 'hostNamedAction', name: 'split_delta', value: '-1' } },
                              ],
                              contentAlignment: 'center',
                              children: [{ text: { text: '-1 Person', color: '#FFE2E8F0', fontSize: 14, fontWeight: 600 } }],
                            },
                          },
                          {
                            box: {
                              modifiers: [
                                { width: 160 },
                                { height: 44 },
                                { clip: { type: 'roundedRect', radius: 10 } },
                                { background: '@card' },
                                { onClick: { type: 'hostNamedAction', name: 'split_delta', value: '1' } },
                              ],
                              contentAlignment: 'center',
                              children: [{ text: { text: '+1 Person', color: '#FFE2E8F0', fontSize: 14, fontWeight: 600 } }],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },
];

export function findPresetById(id: string): WidgetPreset | undefined {
  return WIDGET_PRESETS.find((p) => p.id === id);
}

export function matchPresetForPrompt(prompt: string): WidgetPreset {
  const lower = prompt.toLowerCase();
  let best = WIDGET_PRESETS[0];
  let bestScore = -1;

  for (const preset of WIDGET_PRESETS) {
    let score = 0;
    for (const kw of preset.keywords) {
      if (lower.includes(kw)) score += 2;
    }
    if (lower.includes(preset.id)) score += 3;
    if (score > bestScore) {
      bestScore = score;
      best = preset;
    }
  }

  return best;
}
