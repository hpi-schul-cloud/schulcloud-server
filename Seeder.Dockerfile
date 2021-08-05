FROM mongo:4.2

WORKDIR /schulcloud-server-seeder

# copy seed script and seed data
COPY backup.sh .
COPY backup/setup/* backup/setup/


# import seed data
CMD ["./backup.sh", "-p", "setup/", "import"]
