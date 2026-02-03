from demoparser2 import DemoParser
import pandas as pd

demo = r'C:\Users\Roger\Desktop\heroic-ct-vs-furia-t-m3-nuke.dem'
rd = DemoParser(demo).parse_event('round_end')
df = rd.dropna(subset=['winner'])

print("Verificar índices após dropna:")
print("Índices do df:", df.index.tolist()[:15])
print()

print("Dados após dropna (primeiras 15 linhas):")
for i in range(min(15, len(df))):
    idx = df.index[i]
    r = df.iloc[i]
    prev_tick = df.iloc[i-1]['tick'] if i > 0 else 0
    is_ordered = r['tick'] >= prev_tick
    print(f"iloc {i} (index {idx}): round={r['round']}, tick={r['tick']} {'✅' if is_ordered else '❌'}")
