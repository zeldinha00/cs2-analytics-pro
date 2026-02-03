from demoparser2 import DemoParser

demo = r'C:\Users\Roger\Desktop\heroic-ct-vs-furia-t-m3-nuke.dem'
rd = DemoParser(demo).parse_event('round_end')
df_clean = rd.dropna(subset=['winner'])

print('ÍNDICE 11 NO ORIGINAL:')
row_orig = rd.iloc[11]
print(f'Round: {row_orig["round"]}, Reason: {row_orig["reason"]}, Tick: {row_orig["tick"]}')

print('\nÍNDICE 11 APÓS DROPNA (MESMA POSIÇÃO):')
row_clean = df_clean.iloc[11]
print(f'Round: {row_clean["round"]}, Reason: {row_clean["reason"]}, Tick: {row_clean["tick"]}')

print('\nVERIFICAR DIFERENÇA:')
print(f'Índices do original: {rd.index.tolist()}')
print(f'Índices após dropna: {df_clean.index.tolist()}')
