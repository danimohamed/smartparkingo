package org.example.smartparking.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.smartparking.entity.*;
import org.example.smartparking.repository.ParkingRepository;
import org.example.smartparking.repository.ParkingReviewRepository;
import org.example.smartparking.repository.ParkingSlotRepository;
import org.example.smartparking.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.SplittableRandom;

/**
 * Seeds parking slots data on startup.
 * Each parking gets 50 slots across 5 floors (10 slots per floor).
 * Only runs if parkings exist and have fewer than 50 slots.
 */
@Component
@Order(1)
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ParkingRepository parkingRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingReviewRepository parkingReviewRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SeedProperties seedProperties;

    private static final String[] ABOVE_GROUND_FLOORS = {"RDC", "1", "2", "3", "4"};
    private static final String[] UNDERGROUND_FLOORS = {"-1", "-2", "-3", "-4", "-5"};
    private static final String[] FLOOR_PREFIXES = {"A", "B", "C", "D", "E"};

    // Parkings that are underground (by name keywords)
    private static final String[] UNDERGROUND_KEYWORDS = {"Eden", "16 Novembre", "Menara Mall", "Al Mazar"};

    @Override
    @Transactional
    public void run(String... args) {
        // Seed default admin user if not exists
        seedDefaultAdmin();
        linkParkingsToNamedOwners();
        seedParkingOwnerPasswords();
        seedDefaultGuards();
        seedDefaultParkingImages();
        List<User> reviewUsers = seedRandomReviewUsers();
        seedRandomReviews(reviewUsers);

        List<Parking> parkings = parkingRepository.findAll();

        if (parkings.isEmpty()) {
            log.info("No parkings found. Skipping slot seeding.");
            return;
        }

        for (Parking parking : parkings) {
            long existingSlots = parkingSlotRepository.findByParkingId(parking.getId()).size();

            if (existingSlots >= 50) {
                log.info("Parking '{}' already has {} slots. Skipping.", parking.getName(), existingSlots);
                continue;
            }

            // Delete existing slots for this parking (if any partial data)
            if (existingSlots > 0) {
                List<ParkingSlot> oldSlots = parkingSlotRepository.findByParkingId(parking.getId());
                parkingSlotRepository.deleteAll(oldSlots);
                log.info("Deleted {} old slots for parking '{}'", existingSlots, parking.getName());
            }

            // Determine floor type
            boolean isUnderground = false;
            for (String keyword : UNDERGROUND_KEYWORDS) {
                if (parking.getName().contains(keyword)) {
                    isUnderground = true;
                    break;
                }
            }
            String[] floors = isUnderground ? UNDERGROUND_FLOORS : ABOVE_GROUND_FLOORS;

            // Create 50 slots (5 floors x 10 slots)
            List<ParkingSlot> newSlots = generateSlots(parking, floors);
            parkingSlotRepository.saveAll(newSlots);

            // Update total_slots to 50
            parking.setTotalSlots(50);
            parkingRepository.save(parking);

            log.info("Created 50 slots for parking '{}' ({} floors)", parking.getName(), floors.length);
        }

        log.info("=== Data seeding complete. Total slots: {} ===", parkingSlotRepository.count());
    }

    private void seedDefaultParkingImages() {
        int updated = 0;
        for (Parking p : parkingRepository.findAll()) {
            if (p.getImageUrl() != null && !p.getImageUrl().isBlank()) continue;
            // Nice deterministic placeholder
            p.setImageUrl("https://picsum.photos/seed/parking-" + p.getId() + "/900/520");
            parkingRepository.save(p);
            updated++;
        }
        if (updated > 0) {
            log.info("Filled imageUrl for {} parking(s) with placeholders.", updated);
        }
    }

    private List<User> seedRandomReviewUsers() {
        // Create a few demo users to author reviews
        List<User> existing = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.USER)
                .toList();
        if (existing.size() >= 8) {
            return existing;
        }
        String pwd = seedProperties.getDemoUserPassword();
        String[] names = {
                "Sara Benali", "Youssef El Idrissi", "Omar Zahra", "Nadia Bakkali",
                "Imane Ait Lahcen", "Rachid Amrani", "Khadija El Fassi", "Hamid Ziani",
                "Salma El Ouali", "Ayoub Chafik"
        };
        List<User> created = new ArrayList<>();
        int i = 0;
        for (String fullName : names) {
            if (created.size() + existing.size() >= 10) break;
            String email = ("user." + (fullName.toLowerCase().replace(" ", ".").replace("'", "")) + "@smartparking.com")
                    .replace("..", ".");
            if (userRepository.findByEmail(email).isPresent()) continue;
            User u = User.builder()
                    .fullName(fullName)
                    .email(email)
                    .phone("+2126" + String.format("%08d", 10000000 + i))
                    .password(passwordEncoder.encode(pwd))
                    .role(Role.USER)
                    .build();
            userRepository.save(u);
            created.add(u);
            i++;
        }
        if (!created.isEmpty()) {
            log.info("Created {} demo USER account(s) for reviews (password: app.seed.demo-user-password).", created.size());
        }
        List<User> all = new ArrayList<>();
        all.addAll(existing);
        all.addAll(created);
        return all;
    }

    private void seedRandomReviews(List<User> users) {
        if (users == null || users.isEmpty()) return;
        String[] comments = {
                "Easy to find and smooth entry. Highly recommend.",
                "Good availability and fair pricing.",
                "Clean and well-organized. Guard was helpful.",
                "Great location, but can be busy at peak hours.",
                "Parking layout is clear. Payment was quick.",
                "Nice spot near the center. Would use again.",
                "Safe and convenient. Signage could be improved slightly.",
                "Very practical, saved me a lot of time.",
                "Good experience overall. App made it simple.",
                "Affordable and close to my destination."
        };
        SplittableRandom r = new SplittableRandom(1337L);
        int created = 0;
        for (Parking p : parkingRepository.findAll()) {
            long count = parkingReviewRepository.countByParkingId(p.getId());
            if (count >= 3) continue;
            int n = 3 + r.nextInt(6); // 3..8
            for (int i = 0; i < n; i++) {
                User u = users.get(r.nextInt(users.size()));
                int rating = 3 + r.nextInt(3); // 3..5
                if (r.nextInt(10) == 0) rating = 2; // rare 2-star
                ParkingReview pr = ParkingReview.builder()
                        .parking(p)
                        .user(u)
                        .rating(rating)
                        .comment(comments[r.nextInt(comments.length)])
                        .build();
                parkingReviewRepository.save(pr);
                created++;
            }
        }
        if (created > 0) {
            log.info("Seeded {} parking review(s).", created);
        }
    }

    private void seedDefaultAdmin() {
        String adminEmail = "admin@smartparking.com";
        String adminPassword = seedProperties.getAdminPassword();

        userRepository.findByEmail(adminEmail).ifPresentOrElse(
                existingAdmin -> {
                    // Reset password to ensure it matches the configured seed default
                    existingAdmin.setPassword(passwordEncoder.encode(adminPassword));
                    existingAdmin.setRole(Role.ADMIN);
                    userRepository.save(existingAdmin);
                    log.info("Default admin '{}' password reset to configured seed default.", adminEmail);
                },
                () -> {
                    User admin = User.builder()
                            .fullName("Admin User")
                            .email(adminEmail)
                            .password(passwordEncoder.encode(adminPassword))
                            .phone("+212600000000")
                            .role(Role.ADMIN)
                            .build();
                    userRepository.save(admin);
                    log.info("Default admin '{}' created.", adminEmail);
                }
        );
    }

    /**
     * Links each parking to the user whose full name is {@code "<parking name> owner"} (seeded in schema.sql).
     */
    private void linkParkingsToNamedOwners() {
        int n = 0;
        for (Parking p : parkingRepository.findAll()) {
            if (p.getOwner() != null) {
                continue;
            }
            String expectedFullName = p.getName() + " owner";
            Optional<User> ou = userRepository.findFirstByFullNameOrderByIdAsc(expectedFullName);
            if (ou.isPresent() && ou.get().getRole() == Role.PARKING_OWNER) {
                p.setOwner(ou.get());
                parkingRepository.save(p);
                n++;
            }
        }
        if (n > 0) {
            log.info("Linked {} parking(s) to per-lot owners by full name.", n);
        }
    }

    /** Sets app.seed.owner-password for seeded accounts owner.*@smartparking.com. */
    private void seedParkingOwnerPasswords() {
        String pwd = seedProperties.getOwnerPassword();
        int updated = 0;
        for (User u : userRepository.findAll()) {
            if (u.getRole() != Role.PARKING_OWNER || u.getEmail() == null) {
                continue;
            }
            if (!u.getEmail().startsWith("owner.") || !u.getEmail().endsWith("@smartparking.com")) {
                continue;
            }
            if (u.getPassword() != null && passwordEncoder.matches(pwd, u.getPassword())) {
                continue;
            }
            u.setPassword(passwordEncoder.encode(pwd));
            userRepository.save(u);
            updated++;
        }
        if (updated > 0) {
            log.info("Reset password (app.seed.owner-password) for {} seeded parking owner account(s).", updated);
        }
    }

    private void seedDefaultGuards() {
        String guardPassword = seedProperties.getGuardPassword();

        // We seed guard accounts in schema.sql, but the bcrypt hash there may not match our documented default.
        // Ensure all guards can log in with the documented password.
        List<User> guards = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.GUARD)
                .toList();

        int updated = 0;
        for (User g : guards) {
            if (g.getPassword() == null || !passwordEncoder.matches(guardPassword, g.getPassword())) {
                g.setPassword(passwordEncoder.encode(guardPassword));
                userRepository.save(g);
                updated++;
            }
        }
        if (updated > 0) {
            log.info("Updated {} guard account password(s) to documented default.", updated);
        }
    }

    private List<ParkingSlot> generateSlots(Parking parking, String[] floors) {
        List<ParkingSlot> slots = new ArrayList<>();
        SplittableRandom random = new SplittableRandom(parking.getId()); // deterministic per parking (non-crypto)

        for (int f = 0; f < floors.length; f++) {
            String floor = floors[f];
            String prefix = FLOOR_PREFIXES[f];

            for (int s = 1; s <= 10; s++) {
                String slotNumber = String.format("%s-%02d", prefix, s);

                SlotType slotType = pickSlotType(random, s);
                SlotStatus status = pickStatus(random);

                ParkingSlot slot = ParkingSlot.builder()
                        .slotNumber(slotNumber)
                        .status(status)
                        .slotType(slotType)
                        .floor(floor)
                        .parking(parking)
                        .build();
                slots.add(slot);
            }
        }
        return slots;
    }

    /**
     * ~70% STANDARD, ~10% HANDICAPPED, ~10% VIP, ~10% ELECTRIC
     */
    private SlotType pickSlotType(SplittableRandom random, int slotIndex) {
        // Slot 4 on each floor = HANDICAPPED, slot 5 = VIP, slot 8 = ELECTRIC
        if (slotIndex == 4) return SlotType.HANDICAPPED;
        if (slotIndex == 5) return SlotType.VIP;
        if (slotIndex == 8 || slotIndex == 10) {
            int r = random.nextInt(3);
            if (r == 0) return SlotType.ELECTRIC;
            if (r == 1) return SlotType.VIP;
        }
        return SlotType.STANDARD;
    }

    /**
     * ~65% AVAILABLE, ~18% OCCUPIED, ~12% RESERVED, ~5% MAINTENANCE
     */
    private SlotStatus pickStatus(SplittableRandom random) {
        int r = random.nextInt(100);
        if (r < 65) return SlotStatus.AVAILABLE;
        if (r < 83) return SlotStatus.OCCUPIED;
        if (r < 95) return SlotStatus.RESERVED;
        return SlotStatus.MAINTENANCE;
    }
}



