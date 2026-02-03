from demoparser2 import DemoParser
import pandas as pd

demo = r'C:\Users\Roger\Desktop\betboom-t-vs-gentle-mates-ct-m2-mirage.dem'
rd = DemoParser(demo).parse_event('round_end')

print('TODOS OS EVENTOS DA DEMO MIRAGE:')
print('='*70)
print('idx: round | reason | winner | tick')
print('='*70)

for i in range(len(rd)):
    row = rd.iloc[i]
    idx_str = f"{i:2d}"
    round_str = f"{row['round']:2.0f}"
    reason = f"{str(row['reason'])[:18]:20s}" if pd.notna(row['reason']) else 'NaN                 '
    winner = str(row['winner']) if pd.notna(row['winner']) else 'NaN'
    tick = f"{row['tick']:8.0f}"
    print(f"{idx_str}: {round_str} | {reason} | {winner:3s} | {tick}")

print('\n' + '='*70)
print('RESUMO:')
df = rd.dropna(subset=['winner'])
t_wins = len(df[df['winner'] == 'T'])
c_wins = len(df[df['winner'] == 'CT'])
print(f'T wins: {t_wins}, CT wins: {c_wins}, Total: {len(df)}')
print(f'HLTV esperado: 13-6 (Betboom 13 / Gentle 6)')
