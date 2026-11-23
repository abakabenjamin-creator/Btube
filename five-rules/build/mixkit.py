"""Search Mixkit (free license, commercial use incl. YouTube, no attribution required) and list clips.
usage: python3 build/mixkit.py term1 term2 ...   -> prints id | title"""
import re, sys, json, urllib.request, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); CACHE=f'{ROOT}/assets/stock/search_cache.json'
cache=json.load(open(CACHE)) if os.path.exists(CACHE) else {}
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read().decode('utf8','ignore')
def search(term):
    if term in cache: return cache[term]
    slug=term.strip().lower().replace(' ','-'); out={}
    for u in (f'https://mixkit.co/free-stock-video/{slug}/', f'https://mixkit.co/free-stock-video/discover/{slug}/'):
        try: h=get(u)
        except Exception: continue
        for s,i in re.findall(r'/free-stock-video/([a-z0-9-]+?)-(\d{3,6})/',h): out[i]=s.replace('-',' ')
    cache[term]=out; json.dump(cache,open(CACHE,'w')); return out
if __name__=='__main__':
    for t in sys.argv[1:]:
        r=search(t); print(f'## {t} ({len(r)})')
        for i,s in list(r.items())[:40]: print(f'{i} | {s}')
