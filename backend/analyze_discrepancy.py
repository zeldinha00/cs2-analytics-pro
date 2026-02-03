from demoparser2 import DemoParser

demo = r'C:\Users\Roger\Desktop\heroic-ct-vs-furia-t-m3-nuke.dem'
rd = DemoParser(demo).parse_event('round_end')

print('Round 1 (NaN - warmup):')
r1 = rd.iloc[0]
print(f'  Round: {r1["round"]}, Reason: {r1["reason"]}, Winner: {r1["winner"]}, Tick: {r1["tick"]}')

print('\nRound 2 (primeiro válido):')
r2 = rd.iloc[1]
print(f'  Round: {r2["round"]}, Reason: {r2["reason"]}, Winner: {r2["winner"]}, Tick: {r2["tick"]}')

print('\n' + '='*70)
print('ANÁLISE: O problema é que demoparser começa em round 1 (warmup),')
print('então tem 24 eventos (1-24) com 1 sendo NaN.')
print('HLTV mostra 22 rounds (13-9), então há UMA discrepância.')
print('\nProbável: há 2 eventos suspeitos - encontrados: warmup + 1 outro')
