from demoparser2 import DemoParser
import pandas as pd

# AJUSTE O CAMINHO DA DEMO AQUI:
demo = r'C:\Users\Roger\Desktop\vitality-t-vs-falcons-ct-m3-mirage.dem'

print('Analisando:', demo)
print('='*80)

rd = DemoParser(demo).parse_event('round_end')

print('\nTODOS OS EVENTOS DA DEMO VITALITY:')
print('='*80)
print('idx: round | reason                | winner | tick     | bomb_pl | bomb_def')
print('='*80)

# Parse bomb events
try:
    bomb_planted = DemoParser(demo).parse_event('bomb_planted')
    bomb_defused = DemoParser(demo).parse_event('bomb_defused')
except:
    bomb_planted = pd.DataFrame()
    bomb_defused = pd.DataFrame()

for i in range(len(rd)):
    row = rd.iloc[i]
    idx_str = f"{i:2d}"
    round_str = f"{row['round']:2.0f}"
    reason = f"{str(row['reason'])[:18]:20s}" if pd.notna(row['reason']) else 'NaN                 '
    winner = str(row['winner']) if pd.notna(row['winner']) else 'NaN'
    tick = f"{row['tick']:8.0f}"
    
    # Checar se teve bomb planted/defused nesse tick range
    bp = False
    bd = False
    
    if i < len(rd) - 1:
        next_tick = rd.iloc[i+1]['tick']
        if len(bomb_planted) > 0 and 'tick' in bomb_planted.columns:
            bp = len(bomb_planted[(bomb_planted['tick'] >= row['tick']) & (bomb_planted['tick'] < next_tick)]) > 0
        if len(bomb_defused) > 0 and 'tick' in bomb_defused.columns:
            bd = len(bomb_defused[(bomb_defused['tick'] >= row['tick']) & (bomb_defused['tick'] < next_tick)]) > 0
    
    bp_str = 'YES' if bp else '   '
    bd_str = 'YES' if bd else '   '
    
    print(f"{idx_str}: {round_str} | {reason} | {winner:3s} | {tick} | {bp_str:7s} | {bd_str}")

print('\n' + '='*80)
print('ANÁLISE:')
df = rd.dropna(subset=['winner'])
print(f'\nTotal de round_end events: {len(rd)}')
print(f'Round_end com winner definido: {len(df)}')

t_wins = len(df[df['winner'] == 'T'])
ct_wins = len(df[df['winner'] == 'CT'])
print(f'\nT wins: {t_wins}')
print(f'CT wins: {ct_wins}')
print(f'Total rounds válidos: {len(df)}')

print(f'\n🎯 RESULTADO ESPERADO: 6-13 (Vitality 6 / Falcons 13)')
print(f'   Vitality começou como T, Falcons como CT')
print(f'   Primeiro round válido DEVE ter defuse (Falcons CT venceu)')

# Encontrar o primeiro round com defuse usando ticks
if len(bomb_defused) > 0 and 'tick' in bomb_defused.columns:
    first_defuse_tick = bomb_defused.iloc[0]['tick']
    print(f'\n🔍 PRIMEIRO DEFUSE no tick: {first_defuse_tick}')
    
    # Encontrar o índice do round_end que contém esse defuse
    for i in range(len(rd)):
        if i < len(rd) - 1:
            if rd.iloc[i]['tick'] <= first_defuse_tick < rd.iloc[i+1]['tick']:
                print(f'   Esse defuse ocorreu no round_end índice {i} (round {rd.iloc[i]["round"]})')
                if i > 0:
                    print(f'\n⚠️  PROBLEMA DETECTADO!')
                    print(f'   Existem {i} rounds ANTES do primeiro defuse')
                    print(f'   Esses são provavelmente rounds de warmup que devem ser removidos')
                    print(f'\n   Rounds a serem removidos (índices): 0 até {i-1}')
                break

print('\n' + '='*80)
