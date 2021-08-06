FROM mongo:4.2

WORKDIR /schulcloud-server-seeder

# copy seed script and seed data
COPY ../backup.sh .
COPY backup/setup/* backup/setup/
COPY seeder.entryfile.sh .

EXPOSE 8080

# import seed data
CMD ["./seeder.entryfile.sh"]
