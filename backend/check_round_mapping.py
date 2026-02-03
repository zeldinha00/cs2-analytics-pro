from demoparser2 import DemoParser
import pandas as pd

demo = r'C:\Users\Roger\Desktop\heroic-ct-vs-furia-t-m3-nuke.dem'
parser = DemoParser(demo)
rd_original = parser.parse_event('round_end')
rd_clean = rd_original.dropna(subset=['winner'])

print("COMPARAÇÃO: ROUND ORIGINAL VS ROUND RENUMERADO")
print("="*70)

# Contar
orig_rounds = sorted(rd_clean['round'].unique().tolist())
print(f"\nRounds originais do demoparser: {orig_rounds}")
print(f"Total: {len(orig_rounds)}")

rd_clean_sorted = rd_clean.sort_values('tick').reset_index(drop=True)
rd_clean_sorted['round_new'] = rd_clean_sorted.index + 1

new_rounds = sorted(rd_clean_sorted['round_new'].unique().tolist())
print(f"\nRounds após renumeração: {new_rounds}")
print(f"Total: {len(new_rounds)}")

print("\n" + "="*70)
print("FALTA:")
falta = [r for r in orig_rounds if r not in rd_clean_sorted['round_new'].tolist()]
print(f"Rounds que desapareceram: {falta}")

print("\n" + "="*70)
print("MAPEAMENTO:")
for i in range(len(rd_clean_sorted)):
    old = rd_clean_sorted.iloc[i]['round']
    new = rd_clean_sorted.iloc[i]['round_new']
    if old != new:
        print(f"Índice {i}: round_original={old} → round_novo={new}")
