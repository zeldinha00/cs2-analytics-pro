from demoparser2 import DemoParser
demo = r'C:\Users\Roger\Desktop\heroic-ct-vs-furia-t-m3-nuke.dem'
rd = DemoParser(demo).parse_event('round_end')

print("Verificar a sequência de rounds no demoparser original:")
print("Índice -> Round | Reason | Tick")
for i in range(len(rd)):
    print(f"{i:2d}        -> {rd.iloc[i]['round']:2} | {str(rd.iloc[i]['reason']):20s} | {rd.iloc[i]['tick']:6.0f}")
