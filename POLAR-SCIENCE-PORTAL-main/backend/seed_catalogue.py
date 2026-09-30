"""Source-checked reference records. No invented measurements or live vessel positions."""
from pathlib import Path
from seed import add, reviewed
from app.repository import Metadata, ingest

def seed():
    common = dict(source_owner='NCPOR', licence='Original factual summary; source material remains with its owner', availability='metadata-only')
    milestones = [
        ('1981 · Indian Antarctic exploration begins', 'Antarctic', 'India began its Antarctic expedition programme in 1981.', 'https://ncps.ncpor.res.in/ncps-2025/about_us.php'),
        ('1989 · Maitri completed', 'Antarctic', 'Maitri, India’s second permanent Antarctic base, was completed in 1989 in the Schirmacher Oasis region.', 'https://npdc.ncpor.res.in/npdc/antarctica_home.action'),
        ('1998 · National polar research institution established', 'Multiple', 'The institution now known as NCPOR was established on 25 May 1998 under the Ministry of Earth Sciences, then the Department of Ocean Development.', 'https://www.ncps.ncpor.res.in/expedition/about_us.php'),
        ('2004 · Southern Ocean pilot expedition', 'Southern Ocean', 'India’s Southern Ocean research programme began with a 2004 pilot expedition aboard ORV Sagar Kanya.', 'https://www.ncpor.res.in/pages/display/97-southernocean'),
        ('2008 · Himadri inaugurated', 'Arctic', 'India inaugurated Himadri at Ny-Ålesund, Svalbard, on 1 July 2008.', 'https://www.ncpor.res.in/arctics'),
        ('2016 · Himansh unveiled', 'Himalaya', 'Himansh, a high-altitude Himalayan research station supporting glacier–climate studies, was unveiled on 9 October 2016.', 'https://www.ncaor.gov.in/pages/view/115/426-himansh'),
    ]
    for title, region, description, url in milestones:
        reviewed(add(**common, title=title, region=region, description=description, source_url=url, resource_type='activity', topics=['history']))
    for title, region, description, url in [
        ('Indian Southern Ocean Research Programme','Southern Ocean','A multidisciplinary programme examining Southern Ocean processes; the pilot expedition took place in 2004 on ORV Sagar Kanya. This record describes a programme, not a current event.','https://www.ncpor.res.in/pages/display/97-southernocean'),
        ('Indian Arctic research at Himadri','Arctic','India’s Arctic research programme includes the Himadri station in Ny-Ålesund. Station inauguration: 1 July 2008. This is a programme reference, not a dated event announcement.','https://www.ncpor.res.in/arctics'),
        ('Himansh glacier–climate research','Himalaya','Himansh supports investigation of Himalayan glaciers and their relationship with climate. This reference does not contain a live glacier-mass-balance time series.','https://www.ncaor.gov.in/pages/view/115/426-himansh'),
    ]:
        reviewed(add(**common,title=title,region=region,description=description,source_url=url,resource_type='activity',topics=['programme']))
    reviewed(add(**common,title='ORV Sagar Kanya · research vessel profile',region='Southern Ocean',description='ORV Sagar Kanya is a multidisciplinary oceanographic research vessel associated with NCPOR. It supported the 2004 pilot Indian Southern Ocean expedition. This is a historical reference profile; current operational status and position are not provided.',source_url='https://www.ncpor.res.in/pages/display/97-southernocean',resource_type='report',topics=['vessel','oceanography']))
    for title, station in [('AWS Data Bharati Station','Bharati'),('AWS Data Maitri Station','Maitri')]:
        reviewed(add(**common,title=title,region='Antarctic',station=station,description=f'The NPDC homepage lists {title}. This is a discovery record only: raw measurements, file size, sampling frequency and units have not been imported or verified.',source_url='https://npdc.ncpor.res.in/',resource_type='dataset',topics=['Atmosphere',station]))
    reviewed(add(**common,title='Pilot Indian Southern Ocean Expedition · 2004',region='Southern Ocean',description='The pilot Indian Southern Ocean expedition took place in 2004 aboard ORV Sagar Kanya. No participant count or voyage track is supplied in this catalogue record.',source_url='https://www.ncpor.res.in/pages/display/97-southernocean',resource_type='expedition',topics=['expedition','2004']))
    imports=Path(__file__).parent/'imports'
    files=[
      ('penguin-beach.jpg', dict(title='Penguin Beach · Operation IceBridge field visit',resource_type='photo',region='Multiple',source_owner='NASA / Maria-Jose Vinas',source_url='https://www.nasa.gov/image-article/penguin-beach/',description='Magellanic penguins near Punta Arenas, Chile, visited by the IceBridge team on a no-flight day. Published 5 November 2012. This is not a photograph of an Indian station or an Antarctic penguin colony.',publication_date='2012-11-05',licence='NASA educational/informational media use: https://www.nasa.gov/nasa-brand-center/images-and-media/; credit NASA / Maria-Jose Vinas',topics=['wildlife','IceBridge','photograph'])),
      ('os-21-419-2025.pdf', dict(title='Hydrographic section along 55° E in the Indian and Southern oceans',resource_type='publication',region='Southern Ocean',source_owner='Katsuro Katsumata, Shigeru Aoki, Kay I. Ohshima, Michiyo Yamamoto-Kawai / Ocean Science',source_url='https://doi.org/10.5194/os-21-419-2025',description='Peer-reviewed hydrographic study published in Ocean Science 21, 419–436 (2025), covering a section along 55° E. This internationally authored paper is relevant to Indian Ocean research; it is not labelled an NCPOR publication. The original PDF is available here with page-level text extraction.',publication_date='2025-02-12',licence='Creative Commons Attribution 4.0; © Authors 2025. Unmodified original PDF. https://creativecommons.org/licenses/by/4.0/',topics=['oceanography','hydrography','55E','publication'])),
    ]
    for filename, fields in files:
        path=imports/filename
        if path.exists(): reviewed(ingest(Metadata(**fields,rights_confirmed=True,availability='offline'),path.read_bytes(),path.suffix)['resource']['id'])
    print('Extended source-backed catalogue seeded.')

if __name__=='__main__': seed()
