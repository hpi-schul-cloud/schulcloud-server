FROM mongo:4.2

WORKDIR /schulcloud-server-seeder

# copy seed script and seed data
COPY backup.sh backup/setup/* ./

# import seed data
# TODO use ENV
CMD ['./backup.sh', '-H', 'mongo:27017', '-p', 'setup/', '-D', 'schulcloud_seed', 'import'
