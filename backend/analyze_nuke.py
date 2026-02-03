import pandas as pd
from demoparser2 import DemoParser

demo = r'C:\Users\Roger\Desktop\heroic-ct-vs-furia-t-m3-nuke.dem'
rd = DemoParser(demo).parse_event('round_end')

print("="*60)
print("ANÁLISE COMPLETA DO NUKE DEMO")
print("="*60)

print(f"\nTotal de linhas: {len(rd)}")
print(f"Linhas com winner NaN: {rd['winner'].isna().sum()}")
print(f"Linhas com winner preenchido: {rd['winner'].notna().sum()}")

df_valid = rd[rd['winner'].notna()]
print(f"\n✅ T wins: {(df_valid['winner']=='T').sum()}")
print(f"✅ CT wins: {(df_valid['winner']=='CT').sum()}")
print(f"📊 Total: {len(df_valid)}")

print("\n" + "="*60)
print("TODOS OS EVENTOS:")
print("="*60)
print(rd.to_string())

print("\n" + "="*60)
print("COMPARAÇÃO COM HLTV (esperado 13-9):")
print("="*60)
print("HLTV: T=13, CT=9 (22 rounds)")
print(f"Sistema atual: T={(df_valid['winner']=='T').sum()}, CT={(df_valid['winner']=='CT').sum()} ({len(df_valid)} rounds)")
print(f"Diferença: +{(df_valid['winner']=='T').sum() - 13} em T, +{(df_valid['winner']=='CT').sum() - 9} em CT")
