from demoparser2 import DemoParser
import pandas as pd

demo = r'C:\Users\Roger\Desktop\heroic-ct-vs-furia-t-m3-nuke.dem'
parser = DemoParser(demo)
rounds_df = parser.parse_event('round_end')

print("=== SIMULANDO EXATAMENTE O PARSE_DEMO.PY ===\n")

# Linha 104-106 do parser
print("PASSO 1: dropna + sort + reset + renumerate")
rounds_df = rounds_df.dropna(subset=['winner'])
print(f"Após dropna: índices são {rounds_df.index.tolist()[:5]}...{rounds_df.index.tolist()[-5:]}")

rounds_df = rounds_df.sort_values('tick').reset_index(drop=True)
print(f"Após sort+reset: índices são {rounds_df.index.tolist()[:5]}...{rounds_df.index.tolist()[-5:]}")

rounds_df['round'] = rounds_df.index + 1
print(f"Após renumerate: round values são {rounds_df['round'].tolist()[:5]}...{rounds_df['round'].tolist()[-5:]}")

print("\n" + "="*70)
print("PASSO 2: Verificar dados dos rounds 11-14")
print("="*70)
for i in range(9, 14):
    print(f"Index {i}: round={rounds_df.iloc[i]['round']}, reason={rounds_df.iloc[i]['reason']}, " +
          f"winner={rounds_df.iloc[i]['winner']}, tick={rounds_df.iloc[i]['tick']}")

print("\n" + "="*70)
print("PASSO 3: Groupby round")
rounds_grouped = rounds_df.groupby('round')
for round_num, round_data in rounds_grouped:
    if round_num in [11, 12, 13, 14]:
        print(f"\nRound {round_num}:")
        print(f"  Data:")
        for idx, row in round_data.iterrows():
            print(f"    index {idx}: reason={row['reason']}, winner={row['winner']}")
        
        # Simular o que o parser faz
        valid_rows = round_data[~round_data['reason'].isna()]
        last_row = valid_rows.loc[valid_rows['tick'].idxmax()]
        print(f"  last_row index: {valid_rows['tick'].idxmax()}")
        print(f"  extracted winner: {last_row['winner']}")
