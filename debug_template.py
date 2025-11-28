"""Debug script to check template and product data."""

from server.src.db import get_engine
from sqlmodel import Session, select
from server.src.models import ShoppingTemplate, TemplateItem, Product, Item, Store, Department
from server.src.user_models import User

engine = get_engine()
with Session(engine) as session:
    # Check for templates matching 'Beilage Kartoffeln'
    templates = session.exec(select(ShoppingTemplate)).all()
    print('All templates in database:')
    for t in templates:
        print(f'  - "{t.name}"')

    # Check specifically for 'Beilage Kartoffeln'
    template = session.exec(
        select(ShoppingTemplate).where(ShoppingTemplate.name == 'Beilage Kartoffeln')
    ).first()
    if template:
        print(f'\nFound template: {template.name}')
        print(f'Template items:')
        for item in template.template_items:
            print(f'  - {item.name}: {item.menge}')
    else:
        print('\nTemplate "Beilage Kartoffeln" NOT FOUND')

    # Check for products named 'Kartoffeln'
    products = session.exec(select(Product).where(Product.name == 'Kartoffeln')).all()
    print(f'\nProducts named "Kartoffeln": {len(products)}')
    for p in products:
        print(f'  - Store ID: {p.store_id}, Fresh: {p.fresh}')
