"""Reproducible, attributed starter catalogue. Never invent raw observations."""
from pathlib import Path
from sqlalchemy.orm import Session
from app.repository import Metadata, Resource, engine, ingest

def add(**values): return ingest(Metadata(**values))['resource']['id']
def reviewed(rid):
    with Session(engine) as session:
        r=session.get(Resource,rid)
        r.data={**r.data,'verification':'curator-reviewed','review_note':'Source catalogue metadata checked against the cited institutional page; not validation of underlying measurements.'}
        session.commit()

def seed():
    common=dict(region='Arctic',resource_type='dataset',source_owner='NCPOR',source_url='https://data.ncpor.res.in/newhtml/3',station='Himadri',licence='Source-owned raw files; permission/access must be checked',availability='metadata-only')
    entries=[('Micro Rain Radar','2014–2017'),('Radiometer','2018–2020'),('OTT PARSIVEL','2018–2021'),('Biodiversity','2020–2024'),('Black Carbon Aerosol Arctic','1–2 July 2010'),('Black Carbon Mass Concentrations','2018–2019'),('Environmental dataset (source row unnamed)','2020'),('Environmental dataset (source row unnamed)','2021'),('Nephelometer NyAlesund','2019–2020'),('Acoustic Doppler Current Profiler','2014–2017'),('ADCP temperature','2014–2017'),('Conductivity, Temperature and Depth','2011–2013'),('Ocean-atmosphere dataset (source row unnamed)','2014–2017')]
    for title,period in entries:
        rid=add(**common,title=f'{title} · {period}',description=f'Himadri catalogue entry: {title}; period {period}. Raw files are not mirrored. Variables, units and quality flags require source-level review.',topics=[title,'Himadri'])
        reviewed(rid)
    add(title='14th Indian Arctic Expedition 2023–2024 report',resource_type='report',region='Arctic',source_owner='NCPOR',source_url='https://www.ncpor.res.in/files/14-Arctic_Expedition-2023-24_Report-Low_Resolution.pdf',description='Institutional expedition report. A local research copy was downloaded for inspection; public redistribution has not been authorized, so this record contains metadata only.',publication_date='2024-07-27',licence='All rights reserved; obtain permission before public mirroring')
    imports=Path(__file__).parent/'imports'
    credit='NASA/Goddard Space Flight Center Scientific Visualization Studio; Blue Marble data courtesy of Reto Stockli (NASA/GSFC)'
    for filename,kind in [('arctic-sea-ice.jpg','photo'),('arctic-sea-ice.mp4','video')]:
        path=imports/filename
        if not path.exists(): continue
        metadata=Metadata(title=f'Arctic sea ice 2009–2010 — {"visualization still" if kind=="photo" else "animation"}',resource_type=kind,region='Arctic',source_owner=credit,source_url='https://svs.gsfc.nasa.gov/3698/',description='NASA scientific visualization of seasonal Arctic sea ice, September 2009 to March 2010. This is a data visualization, not expedition photography or live satellite footage.',publication_date='2010-03-29',licence='Public domain under NASA SVS reuse policy https://svs.gsfc.nasa.gov/help/; attribution retained',rights_confirmed=True,availability='offline',topics=['sea ice','Arctic','seasonal change'])
        reviewed(ingest(metadata,path.read_bytes(),path.suffix)['resource']['id'])
    print('Starter catalogue imported. Existing identical content was preserved.')

if __name__=='__main__': seed()
