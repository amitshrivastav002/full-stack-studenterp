package com.erp.studenterp.repository;

import com.erp.studenterp.entity.HostelRoom;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HostelRoomRepository extends JpaRepository<HostelRoom, Long> {

    Optional<HostelRoom> findByIdAndActiveTrue(Long id);

    List<HostelRoom> findByActiveTrueOrderByBlockNameAscRoomNumberAsc();

    boolean existsByBlockNameIgnoreCaseAndRoomNumberIgnoreCase(String blockName, String roomNumber);

    boolean existsByBlockNameIgnoreCaseAndRoomNumberIgnoreCaseAndIdNot(
            String blockName, String roomNumber, Long id);
}
