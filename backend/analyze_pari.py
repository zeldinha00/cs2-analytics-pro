from demoparser2 import DemoParser
import pandas as pd

demo = r'C:\Users\Roger\Desktop\parivision-t-vs-furia-ct-m2-inferno.dem'
print('Analisando:', demo)
print('='*80)

parser = DemoParser(demo)
rd = parser.parse_event('round_end')

print('\nROUND_END (primeiros 25):')
print('idx | round | reason         | winner | tick')
for i in range(min(25, len(rd))):
    row = rd.iloc[i]
    reason = str(row['reason']) if pd.notna(row['reason']) else 'NaN'
    winner = str(row['winner']) if pd.notna(row['winner']) else 'NaN'
    print(f"{i:2d} | {int(row['round']):2d}    | {reason:14s} | {winner:5s} | {int(row['tick']):6d}")

try:
    bd = parser.parse_event('bomb_defused')
    bp = parser.parse_event('bomb_planted')
except:
    bd = pd.DataFrame()
    bp = pd.DataFrame()

if not bd.empty:
    first_defuse_tick = int(bd.iloc[0]['tick'])
    print(f"\nPrimeiro defuse tick: {first_defuse_tick}")
    # Encontrar round_end que contém esse tick
    for i in range(len(rd)):
        cur = int(rd.iloc[i]['tick'])
        nxt = int(rd.iloc[i+1]['tick']) if i+1 < len(rd) else 10**9
        if cur <= first_defuse_tick < nxt:
            print(f"Defuse cai entre rd[{i}] tick {cur} e próximo {nxt}. Reason desse rd: {rd.iloc[i]['reason']}")
            break

# Contagem por lado com rounds numerados originais
clean = rd.dropna(subset=['winner']).sort_values('tick').reset_index(drop=True)
first12 = clean[(clean['round'] >= 1) & (clean['round'] <= 12)]
second12 = clean[(clean['round'] >= 13) & (clean['round'] <= 24)]
print('\nContagem usando round original:')
print('1-12: T=', len(first12[first12['winner']=='T']), ' CT=', len(first12[first12['winner']=='CT']))
print('13-24: T=', len(second12[second12['winner']=='T']), ' CT=', len(second12[second12['winner']=='CT']))
print('Total limpo:', len(clean))
