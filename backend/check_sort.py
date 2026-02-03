from demoparser2 import DemoParser
import pandas as pd

demo = r'C:\Users\Roger\Desktop\heroic-ct-vs-furia-t-m3-nuke.dem'
rd = DemoParser(demo).parse_event('round_end')
df = rd.dropna(subset=['winner'])

print("ANTES DE sort_values (índices originais):")
print("Índice 11 (round 12):")
print(f"  Reason: {df.iloc[11]['reason']}, Tick: {df.iloc[11]['tick']}")

df_sorted = df.sort_values('tick').reset_index(drop=True)
df_sorted['round_new'] = df_sorted.index + 1

print("\nAPÓS sort_values + reset_index:")
print("Index 11 (new_round 12):")
print(f"  Reason: {df_sorted.iloc[11]['reason']}, Tick: {df_sorted.iloc[11]['tick']}")
print(f"  Round original: {df_sorted.iloc[11]['round']}, Round novo: {df_sorted.iloc[11]['round_new']}")

print("\nTodos os dados após sort_values:")
for i in range(len(df_sorted)):
    if df_sorted.iloc[i]['round'] in [11, 12, 13, 14, 15]:
        print(f"Index {i}: old_round={df_sorted.iloc[i]['round']}, new_round={df_sorted.iloc[i]['round_new']}, " +
              f"reason={df_sorted.iloc[i]['reason']}, tick={df_sorted.iloc[i]['tick']}")
