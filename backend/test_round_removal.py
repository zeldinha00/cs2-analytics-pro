from demoparser2 import DemoParser
import pandas as pd

demo = r'C:\Users\Roger\Desktop\heroic-ct-vs-furia-t-m3-nuke.dem'
rd = DemoParser(demo).parse_event('round_end')
df = rd.dropna(subset=['winner'])

print('ANÁLISE: Identificar qual round precisa ser removido')
print('='*70)

# Mostrar os primeiros rounds
print('\nPrimeiros 5 rounds do demoparser:')
for i in range(min(5, len(df))):
    row = df.iloc[i]
    print(f"Round {row['round']:2d}: reason={row['reason']:20s} winner={row['winner']:3s}")

print('\n' + '='*70)
print('TESTE: Remover cada round e verificar qual resulta em:')
print('- Total: 13-9')
print('- Round 1 (após renumeração): CT win')
print('='*70)

for r_remove in [2, 14, 21]:
    df_test = df[df['round'] != r_remove]
    df_test_sorted = df_test.sort_values('tick').reset_index(drop=True)
    df_test_sorted['round_new'] = df_test_sorted.index + 1
    
    t = len(df_test_sorted[df_test_sorted['winner'] == 'T'])
    c = len(df_test_sorted[df_test_sorted['winner'] == 'CT'])
    
    first_round = df_test_sorted.iloc[0]
    first_winner = first_round['winner']
    
    match = (t == 13 and c == 9)
    
    print(f'\nRemove round {r_remove:2d}:')
    print(f'  Placar: T={t}, CT={c}, Match 13-9? {match}')
    print(f'  Round 1 novo: {first_round["reason"]} → {first_winner} win (esperado: CT)')
    print(f'  Correto? {match and first_winner == "CT"}')
